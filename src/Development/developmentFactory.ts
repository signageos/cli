import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import RestApiV2 from '@signageos/sdk/dist/RestApi/RestApiV2';
import { Development } from '@signageos/sdk/dist/Development/Development';
import { ApiVersions } from '@signageos/sdk/dist/RestApi/apiVersions';
import IOptions from '@signageos/sdk/dist/RestApi/IOptions';
import { createClientVersions } from '../helper';

export interface IDevelopmentFactoryOptions {
	url: string;
	accessToken?: string;
	organizationUid?: string;
}

/**
 * Creates a Development instance using deep SDK imports only.
 * Does NOT touch the SDK barrel or its implicit parameters.
 * All configuration is passed explicitly.
 */
export function createDevelopmentWithOptions(opts: IDevelopmentFactoryOptions): Development {
	const auth = opts.accessToken ? { accessToken: opts.accessToken } : { clientId: '', secret: '' };

	const baseV1: IOptions = {
		url: opts.url,
		auth,
		version: ApiVersions.V1,
		clientVersions: createClientVersions(),
		organizationUid: opts.organizationUid,
	};
	const baseV2: IOptions = { ...baseV1, version: ApiVersions.V2 };

	const v1 = new RestApi(baseV1, { ...baseV1, organizationUid: undefined });
	const v2 = new RestApiV2(baseV2, { ...baseV2, organizationUid: undefined });
	return new Development(v1, v2);
}
