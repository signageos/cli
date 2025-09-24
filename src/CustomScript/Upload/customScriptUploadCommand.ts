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

export const OPTION_LIST = [
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
	{
		name: 'yes',
		type: Boolean,
		description: `Allow to upload new custom script or create new version without confirmation step`,
	},
] as const;

/**
 * Uploads custom script code and configuration to the signageOS platform based on
 * the .sosconfig.json configuration file. Custom Scripts enable advanced device
 * functionality beyond standard applets, including system-level operations and
 * device-specific configurations for multiple platforms.
 *
 * @group Development:2
 *
 * @example
 * ```bash
 * # Upload custom script from current directory
 * sos custom-script upload
 *
 * # Upload with specific organization
 * sos custom-script upload --organization-uid abc123def456
 *
 * # Skip confirmation prompts (useful for CI/CD)
 * sos custom-script upload --yes
 * ```
 *
 * @throws {Error} When .sosconfig.json is missing or invalid
 * @throws {Error} When script platform configuration is missing
 * @throws {Error} When organization access is denied
 * @throws {Error} When script upload fails
 *
 * @see {@link https://developers.signageos.io/docs/custom-scripts/ Custom Scripts Documentation}
 *
 * @see {@link ../generate/ Generate custom script project}
 *
 * @see {@link ../ Custom Script management commands}
 *
 * @since 1.8.0
 */
export const customScriptUpload = createCommandDefinition({
	name: 'upload',
	description: 'Upload custom script to the signageOS platform',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const currentDirectory = process.cwd();
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const organization = await getOrganization(organizationUid);
		const restApi = await createOrganizationRestApi(organization);

		const config = await getConfig(currentDirectory);

		const skipConfirmation = options.yes;
		const customScriptVersion = await ensureCustomScriptVersion(restApi, config, skipConfirmation);

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
