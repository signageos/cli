import should from 'should';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getAuth0Settings, getBoxUrl } from '../../../src/Auth/auth0Settings';

describe('Auth.auth0Settings', function () {
	const ENV_KEYS = [
		'SOS_AUTH0_DOMAIN',
		'SOS_AUTH0_CLIENT_ID',
		'SOS_AUTH0_AUDIENCE',
		'SOS_AUTH0_SCOPE',
		'SOS_BOX_HOST',
		'SOS_DEFAULT_AUTH0_DOMAIN',
		'SOS_DEFAULT_AUTH0_CLIENT_ID',
		'SOS_DEFAULT_AUTH0_AUDIENCE',
		'SOS_DEFAULT_AUTH0_SCOPE',
		'SOS_DEFAULT_BOX_HOST',
	] as const;
	const savedEnv: Record<string, string | undefined> = {};
	let originalArgv: string[];
	let tempDir: string;
	let originalHome: string | undefined;
	let originalUserProfile: string | undefined;

	beforeEach(function () {
		originalArgv = process.argv.slice();
		process.argv = ['node', 'sos', 'test'];
		for (const key of ENV_KEYS) {
			savedEnv[key] = process.env[key];
			delete process.env[key];
		}
		// Set known package defaults via SOS_DEFAULT_* env vars (simulates .env.production loaded by dotenv)
		process.env.SOS_DEFAULT_AUTH0_DOMAIN = 'auth0.signageos.io';
		process.env.SOS_DEFAULT_AUTH0_CLIENT_ID = '8AU8D3zJ4mK8gszZP3gZO0nv9DusSNjV';
		process.env.SOS_DEFAULT_AUTH0_AUDIENCE = 'https://sos-production.us.auth0.com/api/v2/';
		process.env.SOS_DEFAULT_AUTH0_SCOPE = 'openid profile email offline_access';
		process.env.SOS_DEFAULT_BOX_HOST = 'box.signageos.io';
		tempDir = join(tmpdir(), `cli-auth0-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(tempDir, { recursive: true });
		originalHome = process.env.HOME;
		process.env.HOME = tempDir;
		// os.homedir() reads USERPROFILE on Windows (not HOME), so mock it too — otherwise
		// .sosrc lookups resolve to the real home dir on Windows and these tests silently
		// fall back to defaults.
		originalUserProfile = process.env.USERPROFILE;
		process.env.USERPROFILE = tempDir;
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
	});

	describe('getAuth0Settings', function () {
		it('should return default Auth0 settings from env vars when no profile is set', function () {
			const settings = getAuth0Settings();
			should(settings).have.property('domain', 'auth0.signageos.io');
			should(settings).have.property('clientId', '8AU8D3zJ4mK8gszZP3gZO0nv9DusSNjV');
			should(settings).have.property('audience', 'https://sos-production.us.auth0.com/api/v2/');
			should(settings).have.property('scope', 'openid profile email offline_access');
		});

		it('should use SOS_AUTH0_DOMAIN env var as fallback', function () {
			process.env.SOS_AUTH0_DOMAIN = 'custom.auth0.com';
			const settings = getAuth0Settings();
			should(settings).have.property('domain', 'custom.auth0.com');
		});

		it('should use SOS_AUTH0_CLIENT_ID env var as fallback', function () {
			process.env.SOS_AUTH0_CLIENT_ID = 'my-custom-client-id';
			const settings = getAuth0Settings();
			should(settings).have.property('clientId', 'my-custom-client-id');
		});

		it('should use SOS_AUTH0_AUDIENCE env var as fallback', function () {
			process.env.SOS_AUTH0_AUDIENCE = 'https://custom-api.example.com';
			const settings = getAuth0Settings();
			should(settings).have.property('audience', 'https://custom-api.example.com');
		});

		it('should use SOS_AUTH0_SCOPE env var as fallback', function () {
			process.env.SOS_AUTH0_SCOPE = 'openid custom-scope';
			const settings = getAuth0Settings();
			should(settings).have.property('scope', 'openid custom-scope');
		});

		it('should read Auth0 settings from default profile in ~/.sosrc', function () {
			writeFileSync(
				join(tempDir, '.sosrc'),
				[
					'auth0Domain=profile.auth0.com',
					'auth0ClientId=profile-client-id',
					'auth0Audience=https://profile-audience.com',
					'auth0Scope=openid profile-scope',
				].join('\n'),
			);
			const settings = getAuth0Settings();
			should(settings).deepEqual({
				domain: 'profile.auth0.com',
				clientId: 'profile-client-id',
				audience: 'https://profile-audience.com',
				scope: 'openid profile-scope',
			});
		});

		it('should read Auth0 settings from named profile in ~/.sosrc', function () {
			process.argv = ['node', 'sos', '--profile', 'myprofile', 'test'];
			writeFileSync(
				join(tempDir, '.sosrc'),
				[
					'[profile myprofile]',
					'auth0Domain=named.auth0.com',
					'auth0ClientId=named-client-id',
					'auth0Audience=https://named-audience.com',
				].join('\n'),
			);
			const settings = getAuth0Settings();
			should(settings).have.property('domain', 'named.auth0.com');
			should(settings).have.property('clientId', 'named-client-id');
			should(settings).have.property('audience', 'https://named-audience.com');
		});

		it('should prefer SOS_AUTH0_* env var over profile settings', function () {
			writeFileSync(join(tempDir, '.sosrc'), 'auth0Domain=profile.auth0.com\n');
			process.env.SOS_AUTH0_DOMAIN = 'env.auth0.com';
			const settings = getAuth0Settings();
			should(settings).have.property('domain', 'env.auth0.com');
		});

		it('should prefer profile settings over SOS_DEFAULT_AUTH0_* package defaults', function () {
			writeFileSync(join(tempDir, '.sosrc'), 'auth0Domain=profile.auth0.com\n');
			const settings = getAuth0Settings();
			should(settings).have.property('domain', 'profile.auth0.com');
		});

		it('should fall back to env var when profile field is missing', function () {
			writeFileSync(join(tempDir, '.sosrc'), 'auth0Domain=custom.auth0.com\n');
			const settings = getAuth0Settings();
			should(settings).have.property('domain', 'custom.auth0.com');
			should(settings).have.property('clientId', '8AU8D3zJ4mK8gszZP3gZO0nv9DusSNjV');
		});
	});

	describe('getBoxUrl', function () {
		it('should return default box URL from env var when no profile is set', function () {
			const url = getBoxUrl();
			should(url).equal('box.signageos.io');
		});

		it('should use SOS_BOX_HOST env var as fallback', function () {
			process.env.SOS_BOX_HOST = 'custom.box.example.com';
			const url = getBoxUrl();
			should(url).equal('custom.box.example.com');
		});

		it('should read box URL from default profile in ~/.sosrc', function () {
			writeFileSync(join(tempDir, '.sosrc'), 'boxUrl=soc.broadsign.com\n');
			const url = getBoxUrl();
			should(url).equal('soc.broadsign.com');
		});

		it('should read box URL from named profile in ~/.sosrc', function () {
			process.argv = ['node', 'sos', '--profile', 'whitelabel', 'test'];
			writeFileSync(join(tempDir, '.sosrc'), ['[profile whitelabel]', 'boxUrl=box.whitelabel.com'].join('\n'));
			const url = getBoxUrl();
			should(url).equal('box.whitelabel.com');
		});

		it('should prefer SOS_BOX_HOST env var over profile setting', function () {
			writeFileSync(join(tempDir, '.sosrc'), 'boxUrl=profile.box.com\n');
			process.env.SOS_BOX_HOST = 'env.box.com';
			const url = getBoxUrl();
			should(url).equal('env.box.com');
		});

		it('should prefer profile setting over SOS_DEFAULT_BOX_HOST package default', function () {
			writeFileSync(join(tempDir, '.sosrc'), 'boxUrl=profile.box.com\n');
			const url = getBoxUrl();
			should(url).equal('profile.box.com');
		});
	});
});
