import chalk from 'chalk';
import * as Debug from 'debug';
import { CommandLineOptions } from "command-line-args";
import { getResource, deserializeJSON } from '../../helper';
import { loadConfig } from '../../RunControl/runControlHelper';
const parameters = require('../../../config/parameters');
const debug = Debug('@signageos/cli:Organization:list');

export const organizationList = {
	name: 'list',
	optionList: [],
	commands: [],
	async run(_options: CommandLineOptions) {
		const organizations = await getOrganizations();
		console.log(chalk.yellow(JSON.stringify(organizations, undefined, 2)));
	},
};

async function getOrganizations() {
	const ORGANIZATION_RESOURCE = 'organization';
	const config = await loadConfig();
	const options = {
		url: parameters.apiUrl,
		auth: parameters.auth,
		version: 'v1' as 'v1',
		headers: {
			'X-Auth': config.identification + ':' + config.apiSecurityToken,
		},
	};
	const responseOfGet = await getResource(options, ORGANIZATION_RESOURCE);
	const bodyOfGet = JSON.parse(await responseOfGet.text(), deserializeJSON);
	debug('GET organizations response', bodyOfGet);
	if (responseOfGet.status === 200) {
		return bodyOfGet;
	} else if (responseOfGet.status === 403) {
		throw new Error(`Authentication error. Try to login using ${chalk.green('sos login')}`);
	} else {
		throw new Error('Unknown error: ' + (bodyOfGet && bodyOfGet.message ? bodyOfGet.message : responseOfGet.status));
	}
}
