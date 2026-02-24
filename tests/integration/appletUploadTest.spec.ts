import should from 'should';
import fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';

const CLI_COMMAND = `node ${path.join(process.cwd(), 'dist', 'index.js')}`;
const baseCommand = `${CLI_COMMAND} --version && ${CLI_COMMAND} applet upload`;

const getAbsolutePath = (targetDir: string): string => {
	return path.join(process.cwd(), targetDir);
};

const TEST_OUTPUT_DIR = getAbsolutePath('tests/output/uploadTest');
const SCRIPT_PATH = path.resolve(process.cwd(), 'tools/generate-dummy-applet.mjs');
let UPLOADED_APPLET_UID: string | undefined;
let ORGANIZATION_UID: string | undefined;

describe('e2e.appletUpload', function () {
	// Keep longer timeout for network operations
	this.timeout(300000); // 5 minutes

	before(async function () {
		// Pre-flight check: Verify authentication works before running tests
		// This test requires valid API credentials to upload applets
		let result: string;
		try {
			result = execSync(`${CLI_COMMAND} organization list --api-url ${process.env.SOS_API_URL}`, {
				encoding: 'utf8',
				stdio: ['pipe', 'pipe', 'pipe'],
				env: process.env,
			});
		} catch (error: unknown) {
			const stderr = error && typeof error === 'object' && 'stderr' in error ? String(error.stderr) : String(error);
			throw new Error(`Authentication failed. Check SOS_API_IDENTIFICATION, SOS_API_SECURITY_TOKEN and SOS_API_URL.\n${stderr}`);
		}
		const organizations = JSON.parse(result);
		organizations.should.be.an.Array();
		should(organizations.length).be.above(0, 'No organizations available for testing');
		ORGANIZATION_UID = organizations[0].uid;
	});

	after(async function () {
		if (!process.env.DEBUG && (await fs.pathExists(TEST_OUTPUT_DIR))) {
			await fs.remove(TEST_OUTPUT_DIR);
		}
	});

	it('should generate an applet with defined size and file count', async function () {
		if (await fs.pathExists(TEST_OUTPUT_DIR)) {
			await fs.remove(TEST_OUTPUT_DIR);
		}

		await fs.ensureDir(TEST_OUTPUT_DIR);

		execSync(`node "${SCRIPT_PATH}" --size=10 --files=16`, {
			encoding: 'utf8',
			stdio: 'inherit',
		});

		(await fs.pathExists(TEST_OUTPUT_DIR)).should.be.true('Applet output directory should exist after generation');

		const builtAppletPath = path.join(TEST_OUTPUT_DIR, 'dist', 'index.html');
		(await fs.pathExists(builtAppletPath)).should.be.true(`Built applet not found at ${builtAppletPath} - the build step may have failed`);

		await new Promise((resolve) => setTimeout(resolve, 1000));
	});

	it('should upload the applet', async function () {
		const organizationUid = process.env.SOS_ORGANIZATION_UID || ORGANIZATION_UID;
		should.exist(organizationUid, 'No organization UID available for testing. Cannot proceed.');

		const parts = [
			baseCommand,
			'--api-url',
			process.env.SOS_API_URL!,
			'--yes',
			'--organization-uid',
			organizationUid,
			'--update-package-config',
		];

		const command = parts.join(' ');
		execSync(command, {
			stdio: 'inherit',
			cwd: TEST_OUTPUT_DIR,
			env: {
				...process.env,
				DEBUG: '1',
			},
		});

		const packageJsonPath = path.join(TEST_OUTPUT_DIR, 'package.json');
		(await fs.pathExists(packageJsonPath)).should.be.true('package.json not found after upload');

		const packageJson = await fs.readJSON(packageJsonPath);
		UPLOADED_APPLET_UID = packageJson?.sos?.appletUid;
		should.exist(UPLOADED_APPLET_UID, 'Failed to extract applet UID from package.json after upload');
	});

	// NOTE: Delete command not yet implemented; test intentionally skipped.
	// eslint-disable-next-line mocha/no-pending-tests
	it.skip('should delete the uploaded applet', async function () {
		// Step 3: Test the delete functionality
		console.info(`Would delete uploaded applet with UID: ${UPLOADED_APPLET_UID}`);

		if (!UPLOADED_APPLET_UID) {
			throw new Error('No applet UID available for deletion - upload test may have failed');
		}
	});
});
