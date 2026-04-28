import should from 'should';
import { getAuth0Settings } from '../../../src/Auth/auth0Settings';

describe('Auth.auth0Settings', function () {
	const ENV_KEYS = ['SOS_AUTH0_DOMAIN', 'SOS_AUTH0_CLIENT_ID', 'SOS_AUTH0_AUDIENCE', 'SOS_AUTH0_SCOPE'] as const;
	const savedEnv: Record<string, string | undefined> = {};

	beforeEach(function () {
		for (const key of ENV_KEYS) {
			savedEnv[key] = process.env[key];
			delete process.env[key];
		}
	});

	afterEach(function () {
		for (const key of ENV_KEYS) {
			if (savedEnv[key] !== undefined) {
				process.env[key] = savedEnv[key];
			} else {
				delete process.env[key];
			}
		}
	});

	it('should return default Auth0 settings when no env vars are set', function () {
		const settings = getAuth0Settings();
		should(settings).have.property('domain', 'sos-production.us.auth0.com');
		should(settings).have.property('clientId', '8AU8D3zJ4mK8gszZP3gZO0nv9DusSNjV');
		should(settings).have.property('audience', 'https://sos-production.us.auth0.com/api/v2/');
		should(settings).have.property('scope', 'openid profile email offline_access');
	});

	it('should use SOS_AUTH0_DOMAIN env var when set', function () {
		process.env.SOS_AUTH0_DOMAIN = 'custom.auth0.com';
		const settings = getAuth0Settings();
		should(settings).have.property('domain', 'custom.auth0.com');
	});

	it('should use SOS_AUTH0_CLIENT_ID env var when set', function () {
		process.env.SOS_AUTH0_CLIENT_ID = 'my-custom-client-id';
		const settings = getAuth0Settings();
		should(settings).have.property('clientId', 'my-custom-client-id');
	});

	it('should use SOS_AUTH0_AUDIENCE env var when set', function () {
		process.env.SOS_AUTH0_AUDIENCE = 'https://custom-api.example.com';
		const settings = getAuth0Settings();
		should(settings).have.property('audience', 'https://custom-api.example.com');
	});

	it('should use SOS_AUTH0_SCOPE env var when set', function () {
		process.env.SOS_AUTH0_SCOPE = 'openid custom-scope';
		const settings = getAuth0Settings();
		should(settings).have.property('scope', 'openid custom-scope');
	});

	it('should override all settings when all env vars are set', function () {
		process.env.SOS_AUTH0_DOMAIN = 'test.auth0.com';
		process.env.SOS_AUTH0_CLIENT_ID = 'test-client';
		process.env.SOS_AUTH0_AUDIENCE = 'https://test-api.example.com';
		process.env.SOS_AUTH0_SCOPE = 'openid test';
		const settings = getAuth0Settings();
		should(settings).deepEqual({
			domain: 'test.auth0.com',
			clientId: 'test-client',
			audience: 'https://test-api.example.com',
			scope: 'openid test',
		});
	});
});
