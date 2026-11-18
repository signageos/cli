import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import RestApiV2 from '@signageos/sdk/dist/RestApi/RestApiV2';
import { Development } from '@signageos/sdk/dist/Development/Development';
import { ApiVersions } from '@signageos/sdk/dist/RestApi/apiVersions';
import IOptions from '@signageos/sdk/dist/RestApi/IOptions';
import { createClientVersions } from '../helper';

export interface IDevelopmentFactoryOptions {
	url: string;
	accessToken?: string;
	clientId?: string;
	secret?: string;
	organizationUid?: string;
}

/**
 * Creates a Development instance using deep SDK imports only.
 * Does NOT touch the SDK barrel or its implicit parameters.
 * All configuration is passed explicitly.
 */
export function createDevelopmentWithOptions(opts: IDevelopmentFactoryOptions): Development {
	const auth = opts.accessToken ? { accessToken: opts.accessToken } : { clientId: opts.clientId || '', secret: opts.secret || '' };

	const baseV1: IOptions = {
		url: opts.url,
		auth,
		version: ApiVersions.V1,
		clientVersions: createClientVersions(),
		organizationUid: opts.organizationUid,
	};
	const baseV2: IOptions = { ...baseV1, version: ApiVersions.V2 };

	// Organization-level managers (applet list, V2 device) need the organization. The SDK's own createApiV1
	// passes it with both option sets, and the account-level device calls already relied on that.
	const v1 = new RestApi(baseV1, baseV1);
	const v2 = new RestApiV2(baseV2, baseV2);
	return new Development(v1, v2);
}
