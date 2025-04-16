import chalk from 'chalk';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import {
	getOrganization,
	getOrganizationUidOrDefaultOrSelect,
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
} from '../../Organization/organizationFacade';
import { createOrganizationRestApi } from '../../helper';
import { createDevelopment } from '@signageos/sdk/dist';
import { APPLET_UID_OPTION, getAppletUid, getAppletVersion } from '../appletFacade';
import { log } from '@signageos/sdk/dist/Console/log';
import logger from 'debug';

const debugLog = logger('@signageos/cli:Applet:Build:appletBuildCommand');

export const OPTION_LIST = [NO_DEFAULT_ORGANIZATION_OPTION, ORGANIZATION_UID_OPTION, APPLET_UID_OPTION] as const;

export const appletBuild = createCommandDefinition({
	name: 'build',
	description: 'Build applet locally. The result is a zip file in the /tmp/signageos directory.',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const currentDirectory = process.cwd();
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const organization = await getOrganization(organizationUid);
		const restApi = await createOrganizationRestApi(organization);
		const dev = createDevelopment({
			organizationUid: organization.uid,
		});

		const appletUid = await getAppletUid(restApi, options);
		const appletVersion = await getAppletVersion(currentDirectory);

		const build = await dev.applet.build.build({
			appletUid,
			appletVersion,
			appletPath: currentDirectory,
		});

		log(
			'info',
			`Applet ${chalk.green(appletUid)}@${chalk.green(appletVersion)} was built successfully into "${chalk.green(build.packageArchivePath)}".`,
		);
		debugLog('Applet build result:', build);
	},
});
