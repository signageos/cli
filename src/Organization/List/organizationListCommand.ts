import chalk from 'chalk';
import * as Debug from 'debug';
import { CommandLineOptions } from "command-line-args";
import { getOrganizations } from '../organizationFacade';
import ICommand from '../../Command/ICommand';
const debug = Debug('@signageos/cli:Organization:list');

export const organizationList: ICommand = {
	name: 'list',
	description: 'List organizations for logged account',
	optionList: [],
	commands: [],
	async run(_options: CommandLineOptions) {
		debug('Organization list');
		const organizations = await getOrganizations();
		console.log(chalk.yellow(JSON.stringify(organizations, undefined, 2)));
	},
};
