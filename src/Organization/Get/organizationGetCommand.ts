import chalk from 'chalk';
import * as Debug from 'debug';
import { CommandLineOptions } from "command-line-args";
import { getResource, deserializeJSON, AUTH_HEADER } from '../../helper';
import { loadConfig } from '../../RunControl/runControlHelper';
import * as parameters from '../../../config/parameters';
const debug = Debug('@signageos/cli:Organization:get');

export const organizationGet = {
	name: 'get',
	optionList: [
		{ name: 'organization-uid', type: String, description: 'Organization UID' },
	],
	commands: [],
	async run(options: CommandLineOptions) {
		const organizationUid: string | undefined = options['organization-uid'];
		if (!organizationUid) {
			throw new Error('Missing argument --organization-uid <string>');
		}
		const organization = await getOrganization(organizationUid);
		console.log(chalk.yellow(JSON.stringify(organization, undefined, 2)));
	},
};

export async function getOrganization(organizationUid: string) {
	const ORGANIZATION_RESOURCE = 'organization';
	const config = await loadConfig();
	const options = {
		url: parameters.apiUrl,
		auth: parameters.auth,
		version: 'v1' as 'v1',
		headers: {
			[AUTH_HEADER]: config.identification + ':' + config.apiSecurityToken,
		},
	};
	const responseOfGet = await getResource(options, ORGANIZATION_RESOURCE + '/' + organizationUid);
	const bodyOfGet = JSON.parse(await responseOfGet.text(), deserializeJSON);
	debug('GET organization response', bodyOfGet);
	if (responseOfGet.status === 200) {
		return bodyOfGet;
	} else if (responseOfGet.status === 403) {
		throw new Error(`Authentication error. Try to login using ${chalk.green('sos login')}`);
	} else {
		throw new Error('Unknown error: ' + (bodyOfGet && bodyOfGet.message ? bodyOfGet.message : responseOfGet.status));
	}
}
