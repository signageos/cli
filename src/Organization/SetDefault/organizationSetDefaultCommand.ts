import chalk from 'chalk';
import * as Debug from 'debug';
import { CommandLineOptions } from "command-line-args";
import { getOrganizationUid, getOrganization, ORGANIZATION_UID_OPTION } from '../organizationFacade';
import ICommand from '../../Command/ICommand';
import { updateConfig } from '../../RunControl/runControlHelper';
const debug = Debug('@signageos/cli:Organization:get');

export const organizationSetDefault: ICommand = {
	name: 'set-default',
	description: 'Set default organization to use',
	optionList: [
		ORGANIZATION_UID_OPTION,
	],
	commands: [],
	async run(options: CommandLineOptions) {
		debug('Organization set default');
		const defaultOrganizationUid = await getOrganizationUid(options);
		const organization = await getOrganization(defaultOrganizationUid);
		await updateConfig({
			defaultOrganizationUid,
		});
		console.log(`Organization ${chalk.green(`${organization.title} (${organization.name}, ${organization.uid})`)} has been set as default`);
	},
};
