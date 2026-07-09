import should from 'should';
import { getGlobalApiUrl, getGlobalProfile, validateProfileAndApiUrl } from '../../../src/Command/globalArgs';

describe('Command.globalArgs', function () {
	let originalArgv: string[];
	let originalSosProfile: string | undefined;

	beforeEach(function () {
		originalArgv = process.argv.slice();
		originalSosProfile = process.env.SOS_PROFILE;
		delete process.env.SOS_PROFILE;
	});

	afterEach(function () {
		process.argv = originalArgv;
		if (originalSosProfile !== undefined) {
			process.env.SOS_PROFILE = originalSosProfile;
		} else {
			delete process.env.SOS_PROFILE;
		}
	});

	describe('getGlobalProfile()', function () {
		it('should return undefined when --profile is not specified (sos login)', function () {
			process.argv = ['node', 'sos', 'login'];
			const profile = getGlobalProfile();
			should(profile).be.undefined();
		});

		it('should return SOS_PROFILE when --profile is not specified', function () {
			process.argv = ['node', 'sos', 'login'];
			process.env.SOS_PROFILE = 'from-env';
			const profile = getGlobalProfile();
			should(profile).equal('from-env');
		});

		it('should return profile name when --profile follows the command (sos login --profile X)', function () {
			process.argv = ['node', 'sos', 'login', '--profile', 'X'];
			const profile = getGlobalProfile();
			should(profile).equal('X');
		});

		it('should return profile name when --profile precedes the command (sos --profile X login)', function () {
			process.argv = ['node', 'sos', '--profile', 'X', 'login'];
			const profile = getGlobalProfile();
			should(profile).equal('X');
		});

		it('should prefer --profile over SOS_PROFILE', function () {
			process.argv = ['node', 'sos', '--profile', 'from-cli', 'login'];
			process.env.SOS_PROFILE = 'from-env';
			const profile = getGlobalProfile();
			should(profile).equal('from-cli');
		});
	});

	describe('getGlobalApiUrl()', function () {
		it('should return undefined when --api-url is not specified', function () {
			process.argv = ['node', 'sos', 'login'];
			const url = getGlobalApiUrl();
			should(url).be.undefined();
		});

		it('should return the URL when --api-url is specified', function () {
			process.argv = ['node', 'sos', 'login', '--api-url', 'https://custom-api-url.com'];
			const url = getGlobalApiUrl();
			should(url).equal('https://custom-api-url.com');
		});
	});

	describe('validateProfileAndApiUrl()', function () {
		it('should not throw when neither --profile nor --api-url is specified (sos login)', function () {
			process.argv = ['node', 'sos', 'login'];
			should(() => validateProfileAndApiUrl()).not.throw();
		});

		it('should not throw when only --profile follows the command (sos login --profile X)', function () {
			process.argv = ['node', 'sos', 'login', '--profile', 'X'];
			should(() => validateProfileAndApiUrl()).not.throw();
		});

		it('should not throw when only --profile precedes the command (sos --profile X login)', function () {
			process.argv = ['node', 'sos', '--profile', 'X', 'login'];
			should(() => validateProfileAndApiUrl()).not.throw();
		});

		it('should not throw when only --api-url is specified', function () {
			process.argv = ['node', 'sos', 'login', '--api-url', 'https://custom-api-url.com'];
			should(() => validateProfileAndApiUrl()).not.throw();
		});

		it('should throw when --profile and --api-url are both specified after the command', function () {
			process.argv = ['node', 'sos', 'login', '--profile', 'X', '--api-url', 'https://custom-api-url.com'];
			should(() => validateProfileAndApiUrl()).throw(/mutually exclusive/i);
		});

		it('should throw when --profile precedes the command and --api-url follows (sos --profile X login --api-url ...)', function () {
			process.argv = ['node', 'sos', '--profile', 'X', 'login', '--api-url', 'https://custom-api-url.com'];
			should(() => validateProfileAndApiUrl()).throw(/mutually exclusive/i);
		});

		it('should throw when SOS_PROFILE is set and --api-url is specified', function () {
			process.argv = ['node', 'sos', 'login', '--api-url', 'https://custom-api-url.com'];
			process.env.SOS_PROFILE = 'from-env';
			should(() => validateProfileAndApiUrl()).throw(/mutually exclusive/i);
		});
	});
});
