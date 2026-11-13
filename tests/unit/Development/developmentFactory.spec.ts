import should from 'should';
import sinon from 'sinon';
import { createDevelopmentWithOptions } from '../../../src/Development/developmentFactory';
import { stubSdkFetch } from '../sdkFetchMock';

describe('developmentFactory', function () {
	const url = 'https://api.example.com';

	afterEach(function () {
		sinon.restore();
	});

	it('should use organization credentials when no access token is available', async function () {
		const fetchStub = stubSdkFetch(() => ({ body: [{ uid: 'applet-uid', name: 'applet-name' }] }));
		const dev = createDevelopmentWithOptions({
			url,
			organizationUid: 'organization-uid',
			clientId: 'organization-client-id',
			secret: 'organization-secret',
		});

		await dev.applet.identification.getAppletByName('applet-name');

		should(fetchStub.firstCall.args[1].headers['X-Auth']).equal('organization-client-id:organization-secret');
	});

	it('should scope the applet lookup to the given organization', async function () {
		const fetchStub = stubSdkFetch(() => ({ body: [{ uid: 'applet-uid', name: 'applet-name' }] }));
		const dev = createDevelopmentWithOptions({ url, accessToken: 'account-access-token', organizationUid: 'organization-uid' });

		const applet = await dev.applet.identification.getAppletByName('applet-name');

		should(applet.uid).equal('applet-uid');
		const requestUrl = new URL(fetchStub.firstCall.args[0]);
		should(requestUrl.pathname).equal('/v1/applet');
		should(requestUrl.searchParams.get('organizationUid')).equal('organization-uid');
	});

	it('should scope the device lookup before connecting to the given organization', async function () {
		const fetchStub = stubSdkFetch(() => ({ status: 404 }));
		const dev = createDevelopmentWithOptions({ url, accessToken: 'account-access-token', organizationUid: 'organization-uid' });

		await should(
			dev.deviceConnect.connect('device-uid', { appletUid: 'applet-uid', appletVersion: '1.0.0', appletPublicUrl: 'http://localhost' }),
		).be.rejected();

		const requestUrl = new URL(fetchStub.firstCall.args[0]);
		should(requestUrl.pathname).equal('/v2/device/device-uid');
		should(requestUrl.searchParams.get('organizationUid')).equal('organization-uid');
	});
});
