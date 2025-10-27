import should from 'should';
import * as path from 'path';
import fs from 'fs-extra';
import { exec } from 'child_process';
import * as util from 'util';

const execPromise = util.promisify(exec);

interface NodeVersionTest {
	version: string;
	shouldSucceed: boolean;
	description?: string;
}

const nodeVersionTests: NodeVersionTest[] = [
	{ version: '16', shouldSucceed: false, description: 'No support for node <20' },
	{ version: '20.1.0', shouldSucceed: false, description: 'No support for npm <10' },
	{ version: '20.5.0', shouldSucceed: false, description: 'No support for npm <10' },
	{ version: '20.11.0', shouldSucceed: true, description: 'First discovery' },
	{ version: '20.18.3', shouldSucceed: true, description: 'Last failing version' },
	{ version: '20.19.0', shouldSucceed: true, description: 'First passing version' },
	{ version: '20', shouldSucceed: true, description: 'Installs 20.19.2 passing version' },
	{ version: '22', shouldSucceed: true, description: 'Latest Node version' },
];

const passedTests: string[] = [];
const failedTests: string[] = [];

async function isNodeVersionInstalled(version: string): Promise<boolean> {
	try {
		const result = await execPromise('source ~/.nvm/nvm.sh && nvm ls');
		return result.stdout.includes(`v${version}`);
	} catch {
		return false;
	}
}

async function installNodeVersion(version: string): Promise<boolean> {
	try {
		console.info(`Installing Node.js ${version}...`);
		await execPromise(`source ~/.nvm/nvm.sh && nvm install ${version}`);
		return true;
	} catch (error) {
		console.error(`Failed to install Node.js ${version}:`, error);
		return false;
	}
}

async function testNodeVersion(version: string, shouldSucceed: boolean, description: string): Promise<boolean> {
	console.info(`\n=== Testing on Node ${version} (${description}) ===`);

	// Setup output directories and files
	const outputDir = path.join(__dirname, '..', 'output', 'node_versions');
	fs.ensureDirSync(outputDir);

	const outputFileName = `node${version.replace(/\./g, '_')}.log`;
	const errorFileName = `node${version.replace(/\./g, '_')}_error.log`;
	const outputPath = path.join(outputDir, outputFileName);
	const errorPath = path.join(outputDir, errorFileName);

	// Remove previous logs if they exist
	if (fs.existsSync(outputPath)) {
		fs.removeSync(outputPath);
	}
	if (fs.existsSync(errorPath)) {
		fs.removeSync(errorPath);
	}
	fs.ensureFileSync(outputPath);
	fs.ensureFileSync(errorPath);

	// Check and install the required Node version
	if (!(await isNodeVersionInstalled(version))) {
		const installed = await installNodeVersion(version);
		if (!installed) {
			failedTests.push(`Node ${version} (installation failed)`);
			return false;
		}
	}

	try {
		// Run the commands similarly to the shell script
		console.info(`Running with Node ${version}...`);
		const cliPath = path.join(__dirname, '..', '..', 'dist', 'index.js');
		const command = `source ~/.nvm/nvm.sh && nvm use ${version} && npm install && npm run clean-build && node ${cliPath} --version`;

		// Execute the command
		const { stdout, stderr } = await execPromise(command);

		// Save output to files
		fs.writeFileSync(outputPath, stdout);
		fs.writeFileSync(errorPath, stderr);

		// Command succeeded, check if it was expected to succeed
		if (shouldSucceed) {
			passedTests.push(`Node ${version} (passed as expected)`);
			console.info(`✓ Success: Node ${version} passed as expected.`);
			return true;
		} else {
			failedTests.push(`Node ${version} (expected failure but succeeded)`);
			console.info(`✗ Error: Expected failure on Node ${version} but it succeeded.`);
			return false;
		}
	} catch (error) {
		// Command failed, check if it was expected to fail
		if (error instanceof Error) {
			fs.writeFileSync(errorPath, error.message);
		}

		if (!shouldSucceed) {
			passedTests.push(`Node ${version} (failed as expected)`);
			console.info(`✓ Success: Node ${version} failed as expected.`);
			return true;
		} else {
			failedTests.push(`Node ${version} (expected success but failed)`);
			console.info(`✗ Error: Expected success on Node ${version} but it failed.`);
			console.info(`Error details: ${error}`);
			return false;
		}
	}
}

describe('Node.js Version Compatibility Tests', function () {
	// These tests take time, so increase the timeout
	this.timeout(600000); // 10 minutes

	// Create output directory
	before(() => {
		const outputDir = path.join(__dirname, '..', 'output', 'node_versions');
		fs.ensureDirSync(outputDir);
	});

	// Run tests for each Node.js version
	for (const test of nodeVersionTests) {
		const { version, shouldSucceed, description } = test;

		it(`should ${shouldSucceed ? 'work' : 'fail'} with Node.js ${version} (${description})`, async function () {
			const result = await testNodeVersion(version, shouldSucceed, description || '');
			should(result).be.true(`Node.js ${version} test did not produce the expected result`);
		});
	}

	after(function () {
		console.info('\n==================================================');
		console.info('              TEST RESULTS SUMMARY                ');
		console.info('==================================================');

		console.info('\nPASSED TESTS:');
		if (passedTests.length === 0) {
			console.info('    None');
		} else {
			for (const test of passedTests) {
				console.info(`    ✓ ${test}`);
			}
		}

		console.info('\nFAILED TESTS:');
		if (failedTests.length === 0) {
			console.info('    None - All tests passed!');
		} else {
			for (const test of failedTests) {
				console.info(`    ✗ ${test}`);
			}
		}

		console.info('\n==================================================');
		console.info(`    Tests completed: ${passedTests.length} passed, ${failedTests.length} failed`);
		console.info('==================================================');

		console.info('\nTest results can be found in ./tests/output/node_versions/');
	});
});
