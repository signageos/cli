import chalk from 'chalk';
import { isDeepStrictEqual } from 'util';
import debug from 'debug';
import { log } from '@signageos/sdk/dist/Console/log';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { createOrganizationRestApi } from '../../helper';
import {
	getOrganization,
	getOrganizationUidOrDefaultOrSelect,
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
} from '../../Organization/organizationFacade';
import { ensureCustomScriptVersion, getConfig, uploadCode } from '../customScriptFacade';

const Debug = debug('@signageos/cli:CustomScript:Upload:Command');

export const OPTION_LIST = [NO_DEFAULT_ORGANIZATION_OPTION, ORGANIZATION_UID_OPTION] as const;

export const customScriptUpload = createCommandDefinition({
	name: 'upload',
	description: 'Uploads current custom script version',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const currentDirectory = process.cwd();
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const organization = await getOrganization(organizationUid);
		const restApi = await createOrganizationRestApi(organization);

		const config = await getConfig(currentDirectory);

		const customScriptVersion = await ensureCustomScriptVersion(restApi, config);

		for (const platform of Object.keys(config.platforms)) {
			await uploadCode({
				restApi,
				workDir: currentDirectory,
				platform,
				config: config.platforms[platform],
				customScriptVersion,
			});
		}

		if (!isDeepStrictEqual(customScriptVersion.configDefinition, config.configDefinition)) {
			Debug('Config definition is different, updating custom script version.');
			await restApi.customScript.version.update({
				customScriptUid: customScriptVersion.customScriptUid,
				version: customScriptVersion.version,
				configDefinition: config.configDefinition,
			});
		} else {
			Debug('Config definition is the same, skipping update.');
		}

		log('info', `Custom Script ${chalk.green(config.name)} version ${chalk.green(config.version)} has been uploaded.`);
	},
});
