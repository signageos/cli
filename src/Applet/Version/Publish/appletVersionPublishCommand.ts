import { CommandLineOptions, createCommandDefinition } from '../../../Command/commandDefinition';
import { runAppletVersionStatusAction, STATUS_OPTION_LIST } from '../appletVersionStatusFacade';

/**
 * Publishes an applet version, making it the released version customers receive.
 * The version must have finished building successfully and must not already be
 * published or deprecated.
 *
 * @group Development:151
 *
 * @example
 * ```bash
 * # Publish a specific version (no local applet directory required)
 * sos applet version publish --applet-uid my-applet-uid --applet-version 1.0.0
 *
 * # Publish without confirmation (scripting)
 * sos applet version publish --applet-uid my-applet-uid --applet-version 1.0.0 --yes
 * ```
 *
 * @throws {Error} When the version has not been built, is already published, or is deprecated (409)
 * @throws {Error} When applet or organization access is denied
 *
 * @since 2.9.0
 */
export const appletVersionPublish = createCommandDefinition({
	name: 'publish',
	description: 'Publish an applet version',
	optionList: STATUS_OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof STATUS_OPTION_LIST>) {
		await runAppletVersionStatusAction('publish', options);
	},
});
