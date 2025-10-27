#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track test results
FAILED_TESTS=()
PASSED_TESTS=()

# Create output directory
mkdir -p ./tests/output/node_versions

check_and_install_node() {
    VERSION=$1
    echo -e "Checking if Node.js $VERSION is installed..."
    
    source ~/.nvm/nvm.sh
    nvm ls | grep -q "v$VERSION" >/dev/null 2>&1
    
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}Node.js $VERSION is not installed. Installing now...${NC}"
        nvm install $VERSION
        if [ $? -ne 0 ]; then
            echo -e "${RED}Failed to install Node.js $VERSION. Skipping this version.${NC}"
            return 1
        fi
        echo -e "${GREEN}Successfully installed Node.js $VERSION${NC}"
    else
        echo -e "${GREEN}Node.js $VERSION is already installed${NC}"
    fi
    return 0
}

test_node_version() {
    VERSION=$1
    SHOULD_SUCCEED=$2
    OUTPUT_FILE="./tests/output/node_versions/node${VERSION//./_}.log"
    ERROR_FILE="./tests/output/node_versions/node${VERSION//./_}_error.log"
    
    echo -e "${YELLOW}=== Testing on Node $VERSION... ===${NC}"
    
    # Remove previous logs if they exist
    [ -f "$OUTPUT_FILE" ] && rm "$OUTPUT_FILE"
    [ -f "$ERROR_FILE" ] && rm "$ERROR_FILE"
    
    # Ensure output files exist
    touch "$OUTPUT_FILE" "$ERROR_FILE"
    
    # Check and install the required Node version
    check_and_install_node "$VERSION"
    if [ $? -ne 0 ]; then
        FAILED_TESTS+=("Node $VERSION (installation failed)")
        return 1
    fi
    
    # Run the commands with unset npm_config_prefix to avoid nvm issues
    echo "Running: nvm use $VERSION && npm install && npm run clean-build && node ./dist/index.js --version"
    
    # Temporarily move .npmrc if it exists to avoid URL placeholder issues
    NPMRC_MOVED=false
    if [ -f ".npmrc" ]; then
        mv .npmrc .npmrc.tmp
        NPMRC_MOVED=true
    fi
    
    source ~/.nvm/nvm.sh && \
    echo "Node.js environment info:" && \
    nvm --version && \
    nvm use $VERSION && \
    node --version && npm --version && \
    echo "Running clean-build..." && \
    npm run clean-build && \
    echo "Testing CLI..." && \
    node ./dist/index.js --version > "$OUTPUT_FILE" 2> "$ERROR_FILE"
    RESULT_CODE=$?
    
    # Restore .npmrc if it was moved
    if [ "$NPMRC_MOVED" = true ]; then
        mv .npmrc.tmp .npmrc
    fi
    
    # Check if the result matches expectations
    if [ "$SHOULD_SUCCEED" = "true" ] && [ $RESULT_CODE -ne 0 ]; then
        echo -e "${RED}Error: Expected success on Node $VERSION but it failed.${NC}"
        echo -e "${RED}Error output:${NC}"
        cat "$ERROR_FILE"
        FAILED_TESTS+=("Node $VERSION (expected success)")
    elif [ "$SHOULD_SUCCEED" = "false" ] && [ $RESULT_CODE -eq 0 ]; then
        echo -e "${RED}Error: Expected failure on Node $VERSION but it succeeded.${NC}"
        FAILED_TESTS+=("Node $VERSION (expected failure)")
    else
        if [ "$SHOULD_SUCCEED" = "true" ]; then
            echo -e "${GREEN}✓ Success: Node $VERSION passed as expected.${NC}"
            PASSED_TESTS+=("Node $VERSION (passed as expected)")
        else
            echo -e "${GREEN}✓ Success: Node $VERSION failed as expected.${NC}"
            PASSED_TESTS+=("Node $VERSION (failed as expected)")
        fi
    fi
    
    echo ""
}

echo -e "${YELLOW}==================================================${NC}"
echo -e "${YELLOW}    Running Node.js version compatibility tests    ${NC}"
echo -e "${YELLOW}==================================================${NC}"

# Run tests for different Node versions
test_node_version "16" "false"      # No support for node <20
test_node_version "20.1.0" "false"  # No support for npm <10
test_node_version "20.5.0" "false"  # No support for npm <10
test_node_version "20.11.0" "true"  # First discovery
test_node_version "20.18.3" "true"  # Last failing version
test_node_version "20.19.0" "true"  # First passing version
test_node_version "20" "true"       # Installs 20.19.2 pasing version
test_node_version "22" "true"

echo -e "\n${YELLOW}==================================================${NC}"
echo -e "${YELLOW}              TEST RESULTS SUMMARY                ${NC}"
echo -e "${YELLOW}==================================================${NC}"

# Display passed tests
echo -e "\n${GREEN}PASSED TESTS:${NC}"
if [ ${#PASSED_TESTS[@]} -eq 0 ]; then
    echo -e "${YELLOW}    None${NC}"
else
    for test in "${PASSED_TESTS[@]}"; do
        echo -e "${GREEN}    ✓ $test${NC}"
    done
fi

# Display failed tests
echo -e "\n${RED}FAILED TESTS:${NC}"
if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    echo -e "${GREEN}    None - All tests passed!${NC}"
else
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "${RED}    ✗ $test${NC}"
    done
fi

echo -e "\n${YELLOW}==================================================${NC}"
echo -e "${YELLOW}    Tests completed: ${#PASSED_TESTS[@]} passed, ${#FAILED_TESTS[@]} failed${NC}"
echo -e "${YELLOW}==================================================${NC}"

# Exit with error code if any tests failed
if [ ${#FAILED_TESTS[@]} -ne 0 ]; then
    exit 1
fi

echo ""
echo "Test results can be found in ./tests/output/node_versions/"
