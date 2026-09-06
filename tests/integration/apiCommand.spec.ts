import should from 'should';
import { execSosCommand } from './testTools';

describe('apiCommand', function () {
	// Works only after login (same precondition as globalArgs.spec.ts)
	it('should print the raw JSON body of an organization endpoint on stdout', async function () {
		const result = await execSosCommand(['api', '--path', '/v1/device?limit=1']);
		const devices = JSON.parse(result.stdout);
		should(devices).be.an.Array();
	});

	it('should exit 1 with the status on stderr for an unknown path', async function () {
		await should(execSosCommand(['api', '--path', '/v1/this-does-not-exist'])).be.rejectedWith(/HTTP 404/);
	});
});
