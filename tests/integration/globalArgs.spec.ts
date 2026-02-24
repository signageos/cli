import should from 'should';
import { execSosCommand } from './testTools';

describe('globalArgs', function () {
	// Works only after login
	it('should accept use SOS_API_URL default env variable from .env file', async function () {
		const result = await execSosCommand(['organization', 'list']);
		const organizationList = JSON.parse(result.stdout);
		should(organizationList).be.an.Array();
	});

	it('should accept --api-url as high priority over env variable and ~/.sosrc', async function () {
		// This test verifies that the --api-url argument takes priority over environment variables
		// We expect the command to fail when trying to connect to an invalid URL
		await should(execSosCommand(['organization', 'list', '--api-url', 'https://api.example.com'])).rejectedWith(
			/fetch failed|getaddrinfo ENOTFOUND/,
		);
	});
});
