import chalk from 'chalk';
import { log } from '@signageos/sdk/dist/Console/log';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import {
	getOrganization,
	getOrganizationUidOrDefaultOrSelect,
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
} from '../../Organization/organizationFacade';
import { getConfig } from '../../CustomScript/customScriptFacade';
import { ensurePluginVersion, loadSchemas, uploadCode } from '../pluginFacade';
import { isDeepStrictEqual } from 'util';
import { createOrganizationRestApi } from '../../helper';
import debug from 'debug';

const Debug = debug('@signageos/cli:Plugin:Upload:Command');

export const OPTION_LIST = [
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
	{
		name: 'yes',
		type: Boolean,
		description: 'Skip confirmation prompts for plugin or version creation',
	},
] as const;

/**
 * Uploads current plugin version to the signageOS platform based on configuration
 * and schema files in the current directory. Handles plugin and version management automatically.
 *
 * May prompt for confirmation when creating new plugins or versions.
 * Use `--yes` to skip confirmation prompts for automated deployments.
 *
 * @group Development:32
 *
 * @example
 * ```bash
 * # Upload plugin from current directory
 * sos plugin upload
 *
 * # Upload with specific organization, skip prompts
 * sos plugin upload --organization-uid abc123def456 --yes
 * ```
 *
 * @since 2.6.0
 */
export const pluginUpload = createCommandDefinition({
	name: 'upload',
	description: 'Uploads current plugin version',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const currentDirectory = process.cwd();
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const organization = await getOrganization(organizationUid);
		const restApi = await createOrganizationRestApi(organization);

		const config = await getConfig(currentDirectory);
		const schema = await loadSchemas(currentDirectory);

		const skipConfirmation = !!options.yes;
		const pluginVersion = await ensurePluginVersion(restApi, config, schema, skipConfirmation);

		for (const platform of Object.keys(config.platforms)) {
			const platformConfig = config.platforms[platform];
			if (!platformConfig) {
				console.warn(`Skipping platform ${platform} due to missing configuration`);
				continue;
			}
			await uploadCode({
				restApi,
				workDir: currentDirectory,
				platform,
				config: platformConfig,
				pluginVersion,
			});
		}

		if (!isDeepStrictEqual(pluginVersion.configDefinition, config.configDefinition)) {
			Debug('Config definition is different, updating plugin version.');
			await restApi.plugin.version.update({
				pluginUid: pluginVersion.pluginUid,
				version: pluginVersion.version,
				configDefinition: config.configDefinition,
				schema: [schema],
			});
		} else {
			Debug('Config definition is the same, skipping update.');
		}

		log('info', `Plugin ${chalk.green(config.name)} version ${chalk.green(config.version)} has been uploaded.`);
	},
});
