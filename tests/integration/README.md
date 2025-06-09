# Node.js Version Compatibility Tests

This directory contains an integration test that verifies compatibility of the CLI with different Node.js versions.

## Overview

The `nodeVersions.spec.ts` test file implements the functionality from the original `test-node-versions.sh` shell script as a Mocha test suite. It tests the CLI against multiple Node.js versions to ensure that:

1. Incompatible Node.js versions fail as expected
2. Compatible Node.js versions work correctly
3. The minimum supported version requirements are met

## Prerequisites

- NVM (Node Version Manager) must be installed
- You should have an internet connection to download Node.js versions if they're not already installed

## Running the Tests

You can run the Node.js version compatibility tests using:

```
npm run test:integration:node-versions
```

This will:
1. Check which Node.js versions are installed via NVM
2. Install missing versions as needed
3. For each version, perform a clean build and test
4. Generate a summary report of passed/failed tests

## Alternative Shell Script

There is also a shell script (`test-node-versions.sh`) available that performs the same compatibility checks. The shell script offers several advantages over the integration test:
- Significantly faster execution time
- Requires fewer system resources
- Provides better debugging output when issues arise

You can run this script directly for quicker testing during development using:

```
npm run test:node-versions
```

## Test Output

Test results are saved in the `tests/output/node_versions/` directory:
- `node{VERSION}.log` - Standard output from running the CLI
- `node{VERSION}_error.log` - Error output from running the CLI

## Tested Versions

The test checks the following Node.js versions:
- Node.js 16 (should fail - below minimum requirement)
- Node.js 20.1.0 (should fail - npm version too low)
- Node.js 20.5.0 (should fail - npm version too low)
- Node.js 20.11.0 (should pass - first compatible version)
- Node.js 20.18.3 (should pass)
- Node.js 20.19.0 (should pass)
- Node.js 20 (latest 20.x - should pass)
- Node.js 22 (latest LTS - should pass)

## Modifying Tests

To add or remove Node.js versions from the test suite, update the `nodeVersionTests` array in `nodeVersions.spec.ts` or `test-node-versions.sh`.

Each test entry includes:
- `version`: The Node.js version to test
- `shouldSucceed`: Whether the test should pass (true) or fail (false)
- `description`: A brief explanation of why this version is being tested
