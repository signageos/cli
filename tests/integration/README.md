# Integration Tests

This directory contains integration tests that test CLI commands end-to-end in various environments.

## Tests in this directory

### CLI Argument Tests (`globalArgs.spec.ts`)
Tests CLI argument parsing and environment variable handling:
- Verifies environment variable loading from `.env` files (specifically `SOS_API_URL`)
- Tests `--api-url` argument has priority over environment variables and `~/.sosrc` config

### Node Version Compatibility (`nodeVersions.spec.ts`)
Tests compatibility with different Node.js versions.

**Running Node Version Tests:**

There are two ways to test Node.js version compatibility:

1. **Using Mocha tests** (automated):
   ```bash
   npm run test:integration:node-versions
   ```
   This runs the Mocha test suite that checks Node.js version compatibility.

2. **Using the shell script** (manual testing across versions):
   ```bash
   npm run test:node-versions
   ```
   This script uses `nvm` to test the CLI across multiple Node.js versions automatically.

**Test Output:**

Test results are saved in the `tests/output/node_versions/` directory:
- `node{VERSION}.log` - Standard output from running the CLI
- `node{VERSION}_error.log` - Error output from running the CLI

**Tested Versions:**

The test checks the following Node.js versions:
- Node.js 16 (should fail - below minimum requirement)
- Node.js 20.1.0 (should fail - npm version too low)
- Node.js 20.5.0 (should fail - npm version too low)
- Node.js 20.11.0 (should pass - first compatible version)
- Node.js 20.18.3 (should pass)
- Node.js 20.19.0 (should pass)
- Node.js 20 (latest 20.x - should pass)
- Node.js 22 (latest LTS - should pass)

**Requirements:**
- `nvm` (Node Version Manager) installed
- Node.js versions will be automatically installed if missing

### `appletUploadTest.spec.ts`
Tests the complete applet upload workflow:
1. Generate a dummy applet
2. Upload it to SignageOS platform
3. Verify the upload was successful
4. ~~Delete the applet from the platform~~ (skipped - delete command not yet implemented)
5. Clean up local files

**Requirements:**
- Valid SignageOS authentication
- Network connectivity
- ~5 minutes execution time

**Note:** The delete test is currently skipped since the `sos applet delete` command is not yet implemented.

### `appletGenerateCommand.spec.ts`
Tests the complete applet generation workflow with various configurations:
1. Generate applets with different bundlers (webpack, rspack)
2. Test different package managers (npm, yarn, pnpm, bun)
3. Test different languages (TypeScript, JavaScript)
4. Build the generated applets to verify they work
5. Test git initialization

**Requirements:**
- All package managers installed (npm, yarn, pnpm, bun)
- Node.js and build tools
- ~3 minutes per test scenario

## Running Integration Tests

Integration tests use `ts-node` to run directly from source (`src/index.ts`), so no build step is required.

```bash
# Run all integration tests
npm run test:integration

# Run with debug output (keeps generated files for applet tests)
DEBUG=1 npm run test:integration
```

## Cleanup

Integration tests automatically clean up local files unless:
- The `DEBUG` environment variable is set
- A test fails unexpectedly

If cleanup fails, you may need to manually remove:
- Generated files in `tests/output/`

**Note:** Uploaded applets currently remain on the SignageOS platform since the delete functionality is not yet implemented. You may need to manually remove them from your organization if needed.
