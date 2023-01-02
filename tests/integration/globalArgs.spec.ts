import * as should from 'should';
import { execSosCommand } from "./testTools";

describe('globalArgs', function () {

	it('should accept use SOS_API_URL default env variable from .env file', async function () {
		const result = await execSosCommand(['organization', 'list']);
		const organizationList = JSON.parse(result.stdout);
		should(organizationList).be.an.Array();
	});

	it('should accept --api-url as high priority over env variable and ~/.sosrc', async function () {
		await should(execSosCommand(['organization', 'list', '--api-url', 'https://api.example.com'])).rejectedWith(
			new RegExp('request to https://api.example.com/v1/organization failed, reason: getaddrinfo ENOTFOUND api.example.com'),
		);
	});
});
