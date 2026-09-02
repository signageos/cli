import should from 'should';
import sinon from 'sinon';

const rewireMock = require('rewiremock').default;

const loadConfigStub = sinon.stub();
const createOrganizationRestApiStub = sinon.stub();
const getOrganizationStub = sinon.stub();

rewireMock('../helper').with({ createOrganizationRestApi: createOrganizationRestApiStub });
rewireMock('../RunControl/runControlHelper').with({ loadConfig: loadConfigStub });
rewireMock('./organizationFacade').with({ getOrganization: getOrganizationStub });
rewireMock.enable();
import { createOrganizationRestApiFromUid } from '../../../src/Organization/organizationRestApi';
rewireMock.disable();

describe('organizationRestApi', function () {
	beforeEach(function () {
		loadConfigStub.reset();
		createOrganizationRestApiStub.reset();
		getOrganizationStub.reset();
	});

	it('should bypass organization lookup for complete organization credentials', async function () {
		const restApi = {};
		loadConfigStub.resolves({
			identification: 'organization-identification',
			apiSecurityToken: 'organization-security-token',
		});
		createOrganizationRestApiStub.resolves(restApi);

		const result = await createOrganizationRestApiFromUid('organization-uid');

		should(result).equal(restApi);
		should(getOrganizationStub.notCalled).be.true();
		should(createOrganizationRestApiStub.calledOnceWithExactly(undefined)).be.true();
	});

	it('should look up organization credentials for an account access token', async function () {
		const restApi = {};
		const organization = {
			uid: 'organization-uid',
			name: 'organization-name',
			title: 'Organization title',
			createdAt: '2026-01-01T00:00:00.000Z',
			oauthClientId: 'organization-client-id',
			oauthClientSecret: 'organization-client-secret',
		};
		loadConfigStub.resolves({ accessToken: 'account-access-token' });
		getOrganizationStub.resolves(organization);
		createOrganizationRestApiStub.resolves(restApi);

		const result = await createOrganizationRestApiFromUid('organization-uid');

		should(result).equal(restApi);
		should(getOrganizationStub.calledOnceWithExactly('organization-uid')).be.true();
		should(createOrganizationRestApiStub.calledOnceWithExactly(organization)).be.true();
	});
});
