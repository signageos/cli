import should from 'should';
import sinon from 'sinon';

const rewireMock = require('rewiremock').default;

const loadConfigStub = sinon.stub();

rewireMock('./RunControl/runControlHelper').with({ loadConfig: loadConfigStub });
rewireMock.enable();
import { createAccountRestApi, createOrganizationRestApi } from '../../src/helper';
rewireMock.disable();

describe('helper authentication', function () {
	beforeEach(function () {
		loadConfigStub.reset();
	});

	describe('createAccountRestApi', function () {
		it('should tell the user to log in when no credentials are stored', async function () {
			loadConfigStub.resolves({ apiUrl: 'https://api.example.com' });

			await should(createAccountRestApi()).be.rejectedWith(/sos login/);
		});

		it('should accept an access token', async function () {
			loadConfigStub.resolves({ apiUrl: 'https://api.example.com', accessToken: 'access-token' });

			await should(createAccountRestApi()).be.fulfilled();
		});

		it('should accept legacy identification and security token', async function () {
			loadConfigStub.resolves({
				apiUrl: 'https://api.example.com',
				identification: 'identification',
				apiSecurityToken: 'security-token',
			});

			await should(createAccountRestApi()).be.fulfilled();
		});
	});

	describe('createOrganizationRestApi', function () {
		it('should tell the user to log in when neither the config nor the organization has credentials', async function () {
			loadConfigStub.resolves({ apiUrl: 'https://api.example.com' });

			await should(createOrganizationRestApi(undefined)).be.rejectedWith(/sos login/);
		});

		it('should accept organization oauth credentials without a logged in account', async function () {
			loadConfigStub.resolves({ apiUrl: 'https://api.example.com' });

			await should(createOrganizationRestApi({ oauthClientId: 'client-id', oauthClientSecret: 'client-secret' })).be.fulfilled();
		});
	});
});
