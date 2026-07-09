import { CommandLineOptions, createCommandDefinition } from '../../../Command/commandDefinition';
import { runAppletVersionStatusAction, STATUS_OPTION_LIST } from '../appletVersionStatusFacade';

/**
 * Deprecates an applet version to retire a broken or obsolete version. The
 * version must not already be deprecated. Use `renew` to un-deprecate it later.
 *
 * @group Development:152
 *
 * @example
 * ```bash
 * # Deprecate a specific version (no local applet directory required)
 * sos applet version deprecate --applet-uid my-applet-uid --applet-version 1.0.0
 *
 * # Deprecate without confirmation (scripting)
 * sos applet version deprecate --applet-uid my-applet-uid --applet-version 1.0.0 --yes
 * ```
 *
 * @throws {Error} When the version is already deprecated (409)
 * @throws {Error} When applet or organization access is denied
 *
 * @since 2.9.0
 */
export const appletVersionDeprecate = createCommandDefinition({
	name: 'deprecate',
	description: 'Deprecate an applet version',
	optionList: STATUS_OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof STATUS_OPTION_LIST>) {
		await runAppletVersionStatusAction('deprecate', options);
	},
});
