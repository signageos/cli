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
import debug from 'debug';

const Debug = debug('@signageos/cli:Applet:Build:appletBuildCommand');

export const OPTION_LIST = [NO_DEFAULT_ORGANIZATION_OPTION, ORGANIZATION_UID_OPTION, APPLET_UID_OPTION] as const;

/**
 * Builds the applet into a distributable package using the signageOS SDK build system.
 * The build process compiles and bundles the applet code, assets, and dependencies
 * into a zip archive ready for upload to the signageOS platform.
 *
 * @group Development:2
 *
 * @example
 * ```bash
 * # Build applet in current directory
 * sos applet build
 *
 * # Build with specific organization
 * sos applet build --organization-uid abc123def456
 *
 * # Build with specific applet UID
 * sos applet build --applet-uid my-applet-uid
 * ```
 *
 * @throws {Error} When applet path is invalid or build process fails
 *
 * @throws {Error} When organization or applet cannot be found
 * @throws {Error} When package.json is missing or invalid
 *
 * @since 1.2.0
 */
export const appletBuild = createCommandDefinition({
	name: 'build',
	description: 'Build applet locally for production deployment.',
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
		Debug('Applet build result:', build);
	},
});
