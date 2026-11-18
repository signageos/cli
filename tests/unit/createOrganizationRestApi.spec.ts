import should from 'should';
import sinon from 'sinon';
import { stubSdkFetch } from './sdkFetchMock';

const rewireMock = require('rewiremock').default;

const loadConfigStub = sinon.stub();

rewireMock('./RunControl/runControlHelper').with({ loadConfig: loadConfigStub });
rewireMock.enable();
import { createOrganizationRestApi } from '../../src/helper';
rewireMock.disable();

describe('createOrganizationRestApi', function () {
	let fetchStub: sinon.SinonStub;

	beforeEach(function () {
		loadConfigStub.reset();
		fetchStub = stubSdkFetch(() => ({ status: 404 }));
	});

	afterEach(function () {
		fetchStub.restore();
	});

	it('should scope account-token requests to the given organization, not the default one', async function () {
		loadConfigStub.resolves({
			apiUrl: 'https://api.example.com',
			accessToken: 'account-access-token',
			defaultOrganizationUid: 'default-organization-uid',
		});

		const restApi = await createOrganizationRestApi(undefined, 'target-organization-uid');
		await restApi.customScript.get('custom-script-uid');

		const url = new URL(fetchStub.firstCall.args[0]);
		should(url.pathname).equal('/v1/custom-script/custom-script-uid');
		should(url.searchParams.get('organizationUid')).equal('target-organization-uid');
	});
});
