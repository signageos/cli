import chalk from 'chalk';
import * as Debug from 'debug';
import { IOrganization } from "../../Organization/organizationCommand";
import * as parameters from "../../../config/parameters";
import { getResource, deserializeJSON } from "../../helper";
const debug = Debug('@signageos/cli:Device:list');

export async function getDevices(organization: IOrganization) {
	const DEVICE_RESOURCE = 'device';
	const options = {
		url: parameters.apiUrl,
		auth: {
			clientId: organization.oauthClientId,
			secret: organization.oauthClientSecret,
		},
		version: 'v1' as 'v1',
	};
	const responseOfGet = await getResource(options, DEVICE_RESOURCE);
	const bodyOfGet = JSON.parse(await responseOfGet.text(), deserializeJSON);
	debug('GET devices response', bodyOfGet);
	if (responseOfGet.status === 200) {
		return bodyOfGet;
	} else if (responseOfGet.status === 403) {
		throw new Error(`Authentication error. Try to login using ${chalk.green('sos login')}`);
	} else {
		throw new Error('Unknown error: ' + (bodyOfGet && bodyOfGet.message ? bodyOfGet.message : responseOfGet.status));
	}
}
