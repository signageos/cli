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
import { ensureRunnerVersion, loadSchemas, uploadCode } from '../runnerFacede';
import { getConfig } from '../../CustomScript/customScriptFacade';

const Debug = debug('@signageos/cli:Runner:Upload:Command');

export const OPTION_LIST = [
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
	{
		name: 'yes',
		type: Boolean,
		description: 'Skip confirmation prompts for runner or version creation',
	},
] as const;

/**
 * Uploads current runner version to the signageOS platform based on configuration
 * and schema files in the current directory. Handles runner and version management automatically.
 *
 * May prompt for confirmation when creating new runners or versions.
 * Use `--yes` to skip confirmation prompts for automated deployments.
 *
 * @group Development:42
 *
 * @example
 * ```bash
 * # Upload runner from current directory
 * sos runner upload
 *
 * # Upload with specific organization, skip prompts
 * sos runner upload --organization-uid abc123def456 --yes
 * ```
 *
 * @since 2.6.0
 */
export const runnerUpload = createCommandDefinition({
	name: 'upload',
	description: 'Uploads current runner version',
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
		const runnerVersion = await ensureRunnerVersion(restApi, config, schema, skipConfirmation);

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
				runnerVersion,
			});
		}

		if (!isDeepStrictEqual(runnerVersion.configDefinition, config.configDefinition)) {
			Debug('Config definition is different, updating runner version.');
			await restApi.runner.version.update({
				runnerUid: runnerVersion.runnerUid,
				version: runnerVersion.version,
				configDefinition: config.configDefinition,
				input: schema.input,
				output: schema.output,
				description: config.description!,
			});
		} else {
			Debug('Config definition is the same, skipping update.');
		}

		log('info', `Runner ${chalk.green(config.name)} version ${chalk.green(config.version)} has been uploaded.`);
	},
});
