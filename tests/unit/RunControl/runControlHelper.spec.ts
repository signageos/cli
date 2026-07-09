import should from 'should';
import sinon from 'sinon';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('RunControl.runControlHelper', function () {
	const ENV_KEYS = [
		'SOS_ACCESS_TOKEN',
		'SOS_API_IDENTIFICATION',
		'SOS_API_SECURITY_TOKEN',
		'SOS_ORGANIZATION_UID',
		'SOS_API_URL',
		'SOS_PROFILE',
	] as const;
	const savedEnv: Record<string, string | undefined> = {};
	let originalArgv: string[];
	let tempDir: string;
	let originalHome: string | undefined;
	let originalUserProfile: string | undefined;

	beforeEach(function () {
		originalArgv = process.argv.slice();
		// Ensure no --profile arg for most tests
		process.argv = ['node', 'sos', 'test'];
		tempDir = join(tmpdir(), `cli-runcontrol-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(tempDir, { recursive: true });
		originalHome = process.env.HOME;
		process.env.HOME = tempDir;
		originalUserProfile = process.env.USERPROFILE;
		process.env.USERPROFILE = tempDir;
		for (const key of ENV_KEYS) {
			savedEnv[key] = process.env[key];
			delete process.env[key];
		}
	});

	afterEach(function () {
		process.argv = originalArgv;
		for (const key of ENV_KEYS) {
			if (savedEnv[key] !== undefined) {
				process.env[key] = savedEnv[key];
			} else {
				delete process.env[key];
			}
		}
		process.env.HOME = originalHome;
		if (originalUserProfile !== undefined) {
			process.env.USERPROFILE = originalUserProfile;
		} else {
			delete process.env.USERPROFILE;
		}
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true });
		}
		sinon.restore();
	});

	it('should export loadConfig, saveConfig, and updateConfig functions', async function () {
		const rawMod = await import('../../../src/RunControl/runControlHelper.js');
		const mod = rawMod.default ?? rawMod;
		should(mod).have.property('loadConfig').which.is.a.Function();
		should(mod).have.property('saveConfig').which.is.a.Function();
		should(mod).have.property('updateConfig').which.is.a.Function();
	});

	describe('loadConfig()', function () {
		async function getLoadConfig() {
			const rawMod = await import('../../../src/RunControl/runControlHelper.js');
			const mod = rawMod.default ?? rawMod;
			return mod.loadConfig as () => Promise<Record<string, unknown>>;
		}

		it('should load named profile from SOS_PROFILE when no --profile is provided', async function () {
			writeFileSync(
				join(tempDir, '.sosrc'),
				['defaultOrganizationUid=default-org', '[profile my-profile]', 'defaultOrganizationUid=named-org'].join('\n'),
			);
			process.env.SOS_PROFILE = 'my-profile';

			const loadConfig = await getLoadConfig();
			const config = await loadConfig();

			should(config).have.property('defaultOrganizationUid', 'named-org');
		});

		it('should return config with accessToken when SOS_ACCESS_TOKEN env var is set', async function () {
			process.env.SOS_ACCESS_TOKEN = 'env-jwt-token-123';
			const loadConfig = await getLoadConfig();
			const config = await loadConfig();
			should(config).have.property('accessToken', 'env-jwt-token-123');
		});

		it('should apply SOS_API_IDENTIFICATION env var override', async function () {
			process.env.SOS_ACCESS_TOKEN = 'token-for-early-return';
			process.env.SOS_API_IDENTIFICATION = 'custom-identification';
			const loadConfig = await getLoadConfig();
			const config = await loadConfig();
			should(config).have.property('identification', 'custom-identification');
		});

		it('should apply SOS_API_SECURITY_TOKEN env var override', async function () {
			process.env.SOS_ACCESS_TOKEN = 'token-for-early-return';
			process.env.SOS_API_SECURITY_TOKEN = 'custom-security-token';
			const loadConfig = await getLoadConfig();
			const config = await loadConfig();
			should(config).have.property('apiSecurityToken', 'custom-security-token');
		});

		it('should apply SOS_ORGANIZATION_UID env var override', async function () {
			process.env.SOS_ACCESS_TOKEN = 'token-for-early-return';
			process.env.SOS_ORGANIZATION_UID = 'org-uid-123';
			const loadConfig = await getLoadConfig();
			const config = await loadConfig();
			should(config).have.property('defaultOrganizationUid', 'org-uid-123');
		});

		it('should apply multiple env var overrides simultaneously', async function () {
			process.env.SOS_ACCESS_TOKEN = 'jwt-token';
			process.env.SOS_API_IDENTIFICATION = 'id-override';
			process.env.SOS_API_SECURITY_TOKEN = 'sec-override';
			process.env.SOS_ORGANIZATION_UID = 'org-override';
			const loadConfig = await getLoadConfig();
			const config = await loadConfig();
			should(config).have.property('accessToken', 'jwt-token');
			should(config).have.property('identification', 'id-override');
			should(config).have.property('apiSecurityToken', 'sec-override');
			should(config).have.property('defaultOrganizationUid', 'org-override');
		});

		it('should return config without accessToken when no tokens are available', async function () {
			const loadConfig = await getLoadConfig();
			const config = await loadConfig();
			// When no SOS_ACCESS_TOKEN and no stored tokens, accessToken should be absent
			should(config).not.have.property('accessToken');
		});
	});
});
