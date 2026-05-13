import should from 'should';
import { getApiUrl, getErrorMessageFromUnknownError } from '../../src/helper';
import { IExtendedConfig } from '../../src/RunControl/runControlHelper';

describe('helper', function () {
	describe('getApiUrl precedence', function () {
		const ENV_KEYS = ['SOS_API_URL', 'SOS_DEFAULT_API_URL'] as const;
		const savedEnv: Record<string, string | undefined> = {};
		let originalArgv: string[];

		beforeEach(function () {
			originalArgv = process.argv.slice();
			process.argv = ['node', 'sos', 'test'];
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
		});

		const cfg = (apiUrl?: string): IExtendedConfig => ({ apiUrl }) as IExtendedConfig;

		it('should prefer --api-url CLI argument over everything else', function () {
			process.argv = ['node', 'sos', '--api-url', 'https://cli.example.com', 'test'];
			process.env.SOS_API_URL = 'https://env.example.com';
			process.env.SOS_DEFAULT_API_URL = 'https://default.example.com';
			should(getApiUrl(cfg('https://profile.example.com'))).equal('https://cli.example.com');
		});

		it('should prefer SOS_API_URL env var over .sosrc and SOS_DEFAULT_API_URL', function () {
			process.env.SOS_API_URL = 'https://env.example.com';
			process.env.SOS_DEFAULT_API_URL = 'https://default.example.com';
			should(getApiUrl(cfg('https://profile.example.com'))).equal('https://env.example.com');
		});

		it('should prefer SOS_API_URL env var over .sosrc even when --profile is active', function () {
			// Critical white-label scenario: explicit env override must win even with a profile
			process.argv = ['node', 'sos', '--profile', 'whitelabel', 'test'];
			process.env.SOS_API_URL = 'https://env.example.com';
			should(getApiUrl(cfg('https://profile.example.com'))).equal('https://env.example.com');
		});

		it('should prefer .sosrc apiUrl over SOS_DEFAULT_API_URL package default', function () {
			// THE BUG: package defaults from .env.production must NEVER override .sosrc
			process.env.SOS_DEFAULT_API_URL = 'https://api.signageos.io';
			should(getApiUrl(cfg('https://api.soc.broadsign.com'))).equal('https://api.soc.broadsign.com');
		});

		it('should fall back to SOS_DEFAULT_API_URL when no CLI/env/profile is set', function () {
			process.env.SOS_DEFAULT_API_URL = 'https://default.example.com';
			should(getApiUrl(cfg(undefined))).equal('https://default.example.com');
		});

		it('should normalize trailing slashes', function () {
			process.env.SOS_DEFAULT_API_URL = 'https://default.example.com///';
			should(getApiUrl(cfg(undefined))).equal('https://default.example.com');
		});

		it('should throw when no source provides an API URL', function () {
			should(() => getApiUrl(cfg(undefined))).throw(/No API URL is defined/);
		});

		it('should not let SOS_DEFAULT_API_URL override .sosrc when --profile is active', function () {
			// Regression guard for the white-label override bug
			process.argv = ['node', 'sos', '--profile', 'whitelabel', 'test'];
			process.env.SOS_DEFAULT_API_URL = 'https://api.signageos.io';
			should(getApiUrl(cfg('https://api.soc.broadsign.com'))).equal('https://api.soc.broadsign.com');
		});
	});

	describe('getErrorMessageFromUnknownError', function () {
		it('should return error message from Error object', function () {
			const error = new Error('Test error message');
			const result = getErrorMessageFromUnknownError(error);
			should(result).be.equal('Test error message');
		});

		it('should return error message from object with message property', function () {
			const error = { message: 'Custom error message' };
			const result = getErrorMessageFromUnknownError(error);
			should(result).be.equal('Custom error message');
		});

		it('should return string representation of string error', function () {
			const error = 'String error';
			const result = getErrorMessageFromUnknownError(error);
			should(result).be.equal('String error');
		});

		it('should return string representation of number error', function () {
			const error = 404;
			const result = getErrorMessageFromUnknownError(error);
			should(result).be.equal('404');
		});

		it('should return string representation of object without message', function () {
			const error = { code: 'ERR_001', status: 500 };
			const result = getErrorMessageFromUnknownError(error);
			should(result).be.equal('[object Object]');
		});

		it('should return null for null error', function () {
			const result = getErrorMessageFromUnknownError(null);
			should(result).be.null();
		});

		it('should return null for undefined error', function () {
			const result = getErrorMessageFromUnknownError(undefined);
			should(result).be.null();
		});

		it('should handle object with non-string message property', function () {
			const error = { message: 42 };
			const result = getErrorMessageFromUnknownError(error);
			should(result).be.equal(42);
		});

		it('should handle object with null message property', function () {
			const error = { message: null };
			const result = getErrorMessageFromUnknownError(error);
			should(result).be.equal(null);
		});
	});
});
