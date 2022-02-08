import * as chalk from 'chalk';
import * as Debug from 'debug';
import { CommandLineOptions } from "command-line-args";
import { getOrganizationUid, getOrganization, ORGANIZATION_UID_OPTION } from '../organizationFacade';
import ICommand from '../../Command/ICommand';
const debug = Debug('@signageos/cli:Organization:get');

export const organizationGet: ICommand = {
	name: 'get',
	description: 'Get one organization by UID',
	optionList: [
		ORGANIZATION_UID_OPTION,
	],
	commands: [],
	async run(options: CommandLineOptions) {
		debug('Organization get');
		const organizationUid = await getOrganizationUid(options);
		const organization = await getOrganization(organizationUid);
		console.log(chalk.yellow(JSON.stringify(organization, undefined, 2)));
	},
};
