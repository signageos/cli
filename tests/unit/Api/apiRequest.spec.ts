import should from 'should';
import sinon from 'sinon';
import * as fs from 'fs-extra';
import * as path from 'path';
import { useTmpFiles } from '../../lib/tmpFiles';

const rewireMock = require('rewiremock').default;

const loadConfigStub = sinon.stub();
rewireMock('../RunControl/runControlHelper').with({ loadConfig: loadConfigStub });
rewireMock.enable();
import { buildRequestUrl, readData, callApi } from '../../../src/Api/apiRequest';
rewireMock.disable();

const API_URL = 'https://api.example.com';

type FetchInit = { method: string; headers: Record<string, string>; body?: string };

describe('Api.apiRequest', function () {
	const tmpDir = useTmpFiles();
	let originalApiUrl: string | undefined;
	let fetchStub: sinon.SinonStub;

	beforeEach(function () {
		originalApiUrl = process.env.SOS_API_URL;
		process.env.SOS_API_URL = API_URL;
		loadConfigStub.reset();
		fetchStub = sinon.stub(globalThis, 'fetch');
	});

	afterEach(function () {
		fetchStub.restore();
		if (originalApiUrl === undefined) {
			delete process.env.SOS_API_URL;
		} else {
			process.env.SOS_API_URL = originalApiUrl;
		}
	});

	describe('buildRequestUrl', function () {
		it('should append organizationUid to the query', function () {
			const url = buildRequestUrl(API_URL, '/v1/device?limit=2', 'org1');
			should(url.toString()).equal('https://api.example.com/v1/device?limit=2&organizationUid=org1');
		});

		it('should keep an organizationUid that is already in the path', function () {
			const url = buildRequestUrl(API_URL, '/v1/device?organizationUid=explicit', 'org1');
			should(url.searchParams.get('organizationUid')).equal('explicit');
		});

		it('should add no organizationUid when none is given', function () {
			const url = buildRequestUrl(API_URL + '/', '/v1/organization', undefined);
			should(url.toString()).equal('https://api.example.com/v1/organization');
		});

		it('should reject a path that does not start with a slash', function () {
			should(() => buildRequestUrl(API_URL, 'v1/device', undefined)).throw(/must start with "\/"/);
		});

		it('should reject a protocol-relative path that would change the host', function () {
			should(() => buildRequestUrl(API_URL, '//evil.example.org/v1/device', undefined)).throw(/must start with "\/"/);
		});

		it('should explain a path rewritten by Git Bash into a Windows file path', function () {
			should(() => buildRequestUrl(API_URL, 'C:/Program Files/Git/v2/device', undefined)).throw(/MSYS_NO_PATHCONV=1/);
		});
	});

	describe('readData', function () {
		it('should return undefined without data', async function () {
			should(await readData(undefined)).be.undefined();
		});

		it('should parse inline JSON', async function () {
			should(await readData('{"a":1}')).deepEqual({ a: 1 });
		});

		it('should read @file JSON', async function () {
			const file = path.join(tmpDir, 'body.json');
			await fs.writeFile(file, '{"devicePowerAction":"SYSTEM_REBOOT"}');
			should(await readData('@' + file)).deepEqual({ devicePowerAction: 'SYSTEM_REBOOT' });
		});

		it('should reject invalid JSON', async function () {
			await should(readData('{not json')).be.rejectedWith(/valid JSON/);
		});
	});

	describe('callApi', function () {
		it('should send X-Auth with the access token and scope the organization', async function () {
			loadConfigStub.resolves({ accessToken: 'tok', defaultOrganizationUid: 'org1' });
			fetchStub.resolves(new Response('{"ok":true}', { status: 200, statusText: 'OK' }));

			const result = await callApi({
				method: 'POST',
				path: '/v1/device/abc/power-action',
				data: '{"devicePowerAction":"SYSTEM_REBOOT"}',
				organizationUid: 'org1',
			});

			should(fetchStub.calledOnce).be.true();
			const [url, init] = fetchStub.firstCall.args as [URL, FetchInit];
			should(url.toString()).equal('https://api.example.com/v1/device/abc/power-action?organizationUid=org1');
			should(init.method).equal('POST');
			should(init.headers['X-Auth']).equal('tok');
			should(init.body).equal('{"devicePowerAction":"SYSTEM_REBOOT"}');
			should(result).deepEqual({ status: 200, statusText: 'OK', body: '{"ok":true}' });
		});

		it('should use clientId:secret and no organizationUid for legacy credentials', async function () {
			loadConfigStub.resolves({ identification: 'id', apiSecurityToken: 'sec' });
			fetchStub.resolves(new Response('[]', { status: 200, statusText: 'OK' }));

			await callApi({ method: 'GET', path: '/v1/device', organizationUid: 'org1' });

			const [url, init] = fetchStub.firstCall.args as [URL, FetchInit];
			should(url.toString()).equal('https://api.example.com/v1/device');
			should(init.headers['X-Auth']).equal('id:sec');
			should(init.body).be.undefined();
		});

		it('should return non-2xx responses instead of throwing', async function () {
			loadConfigStub.resolves({ accessToken: 'tok' });
			fetchStub.resolves(new Response('{"message":"nope"}', { status: 404, statusText: 'Not Found' }));

			const result = await callApi({ method: 'GET', path: '/v1/device/missing' });

			should(result.status).equal(404);
			should(result.body).equal('{"message":"nope"}');
		});

		it('should disable redirects so X-Auth cannot be forwarded to another host', async function () {
			loadConfigStub.resolves({ accessToken: 'tok' });
			fetchStub.resolves(new Response('[]'));

			await callApi({ method: 'GET', path: '/v2/device' });

			should(fetchStub.firstCall.args[1].redirect).equal('error');
		});

		it('should fail before any request when not logged in', async function () {
			loadConfigStub.resolves({});

			await should(callApi({ method: 'GET', path: '/v1/device' })).be.rejectedWith(/Not logged in/);
			should(fetchStub.called).be.false();
		});
	});
});
