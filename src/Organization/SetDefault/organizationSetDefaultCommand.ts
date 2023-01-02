import chalk from 'chalk';
import * as Debug from 'debug';
import { selectOrganizationUid, getOrganization, ORGANIZATION_UID_OPTION } from '../organizationFacade';
import { updateConfig } from '../../RunControl/runControlHelper';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { log } from '@signageos/sdk/dist/Console/log';
const debug = Debug('@signageos/cli:Organization:get');

const OPTION_LIST = [
	ORGANIZATION_UID_OPTION,
] as const;

export const organizationSetDefault = createCommandDefinition({
	name: 'set-default',
	description: 'Set default organization to use',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		debug('Organization set default');
		const defaultOrganizationUid = await selectOrganizationUid(options);
		const organization = await getOrganization(defaultOrganizationUid);
		await updateConfig({
			defaultOrganizationUid,
		});
		log('info', `Organization ${chalk.green(`${organization.title} (${organization.name}, ${organization.uid})`)} has been set as default`);
	},
});
