import should from 'should';

const rewireMock = require('rewiremock').default;

let capturedAuth: unknown;

class RestApiMock {
	public constructor({ auth }: { auth: unknown }) {
		capturedAuth = auth;
	}
}

class RestApiV2Mock {}

class DevelopmentMock {}

rewireMock('@signageos/sdk/dist/RestApi/RestApi').with(RestApiMock);
rewireMock('@signageos/sdk/dist/RestApi/RestApiV2').with(RestApiV2Mock);
rewireMock('@signageos/sdk/dist/Development/Development').with({ Development: DevelopmentMock });
rewireMock('../helper').with({ createClientVersions: () => ({}) });
rewireMock.enable();
import { createDevelopmentWithOptions } from '../../../src/Development/developmentFactory';
rewireMock.disable();

describe('developmentFactory', function () {
	it('should use organization credentials when no access token is available', function () {
		createDevelopmentWithOptions({
			url: 'https://api.signageos.io',
			organizationUid: 'organization-uid',
			clientId: 'organization-client-id',
			secret: 'organization-secret',
		});

		should(capturedAuth).deepEqual({
			clientId: 'organization-client-id',
			secret: 'organization-secret',
		});
	});
});
