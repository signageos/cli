import chalk from 'chalk';
import prompts from 'prompts';
import { log } from '@signageos/sdk/dist/Console/log';
import { createOrganizationRestApi } from '../../helper';
import {
	getOrganization,
	getOrganizationUidOrDefaultOrSelect,
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
} from '../../Organization/organizationFacade';
import { APPLET_UID_OPTION, getAppletUid, getAppletVersionFromApi } from '../appletFacade';
import { CommandLineOptions } from '../../Command/commandDefinition';

export type AppletVersionStatusAction = 'publish' | 'deprecate' | 'renew';

// `--version` is a reserved global flag (prints the CLI version), so the applet version is passed as `--applet-version`.
export const APPLET_VERSION_OPTION = { name: 'applet-version', type: String, description: 'Applet version, e.g. 1.0.0' } as const;

export const STATUS_OPTION_LIST = [
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
	APPLET_UID_OPTION,
	APPLET_VERSION_OPTION,
	{
		name: 'yes',
		type: Boolean,
		description: `Perform the action without the confirmation step`,
	},
] as const;

const PAST_TENSE: { [action in AppletVersionStatusAction]: string } = {
	publish: 'published',
	deprecate: 'deprecated',
	renew: 'renewed',
};

export async function runAppletVersionStatusAction(
	action: AppletVersionStatusAction,
	options: CommandLineOptions<typeof STATUS_OPTION_LIST>,
): Promise<void> {
	const skipConfirmation = !!options.yes;

	const organizationUid = await getOrganizationUidOrDefaultOrSelect(options, skipConfirmation);
	const organization = await getOrganization(organizationUid);
	const restApi = await createOrganizationRestApi(organization);

	// Prefer explicit args so the command works without a local applet directory (bulk scripting across organizations).
	const appletUid = options['applet-uid'] ?? (await getAppletUid(restApi, options));
	const appletVersion = options['applet-version'] ?? (await getAppletVersionFromApi(restApi, appletUid, skipConfirmation));

	if (!skipConfirmation) {
		const response: prompts.Answers<'continue'> = await prompts({
			type: 'confirm',
			name: 'continue',
			message: `Do you want to ${action} applet version ${chalk.green(appletVersion)} (applet ${chalk.green(appletUid)})?`,
		});
		if (!response.continue) {
			throw new Error(`Applet version ${action} canceled`);
		}
	}

	await restApi.applet.version[action](appletUid, appletVersion);

	log('info', `Applet version ${chalk.green(appletVersion)} of applet ${chalk.green(appletUid)} has been ${PAST_TENSE[action]}.`);
}
