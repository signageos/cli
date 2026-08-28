import chalk from 'chalk';
import { isDeepStrictEqual } from 'util';
import debug from 'debug';
import { log } from '@signageos/sdk/dist/Console/log';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { createAccountRestApi, createOrganizationRestApiFromUid } from '../../helper';
import {
	getOrganizationUidOrDefaultOrSelect,
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
} from '../../Organization/organizationFacade';
import { ensureCustomScriptVersion, getConfig, resolveManaged, uploadCode } from '../customScriptFacade';

const Debug = debug('@signageos/cli:CustomScript:Upload:Command');

export const OPTION_LIST = [
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
	{
		name: 'yes',
		type: Boolean,
		description: `Allow to upload new custom script or create new version without confirmation step`,
	},
	{
		name: 'managed',
		type: Boolean,
		description:
			`Upload as a signageOS-managed GLOBAL custom script that has no owning organization and can be run by any organization. ` +
			`Reserved for signageOS admin accounts — regular users cannot create or modify managed scripts.`,
	},
] as const;

/**
 * Uploads custom script code and configuration to signageOS platform from `.sosconfig.json`.
 * Creates/updates script, uploads platform-specific files, and provides script UID for execution.
 *
 * May prompt for confirmation when creating new scripts or versions.
 * Use `--yes` to skip prompts for automated deployments.
 *
 * @group Development:22
 *
 * @example
 * ```bash
 * # Upload interactively
 * sos custom-script upload
 *
 * # Skip confirmations (CI/CD)
 * sos custom-script upload --yes
 *
 * # Specific organization
 * sos custom-script upload --organization-uid abc123def456
 *
 * # Upload as a signageOS-managed GLOBAL script (signageOS admin accounts only)
 * sos custom-script upload --managed
 * ```
 *
 * @throws {Error} When `.sosconfig.json` missing/invalid or upload fails
 *
 * @see {@link https://developers.signageos.io/docs/custom-scripts/ Documentation}
 * @see {@link https://developers.signageos.io/api/#tag/DeviceCustom-Script REST API}
 * @see {@link ../generate/ Generate command}
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
		const skipConfirmation = options.yes;
		// `--managed` and `--organization-uid` are mutually exclusive: a managed script has no owning organization.
		if (options.managed && options['organization-uid'] !== undefined) {
			throw new Error('--managed cannot be combined with --organization-uid (managed scripts have no owning organization).');
		}

		const config = await getConfig(currentDirectory);
		// A script's kind is fixed once it exists; honour the value persisted in the config over the flag.
		const managed = resolveManaged(config, options.managed);

		// Managed (global) scripts have no owning organization and use account-scoped authentication; otherwise the
		// organization is resolved, which lets TypeScript narrow `organizationUid` to `string` for the org REST API.
		const organizationUid = managed ? undefined : await getOrganizationUidOrDefaultOrSelect(options, skipConfirmation);
		const restApi = organizationUid === undefined ? await createAccountRestApi() : await createOrganizationRestApiFromUid(organizationUid);

		const customScriptVersion = await ensureCustomScriptVersion(restApi, config, skipConfirmation, organizationUid, managed);

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
