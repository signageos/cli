import { CommandLineOptions, createCommandDefinition } from '../../../Command/commandDefinition';
import { runAppletVersionStatusAction, STATUS_OPTION_LIST } from '../appletVersionStatusFacade';

/**
 * Renews (un-deprecates) an applet version. The version must currently be
 * deprecated.
 *
 * @group Development:153
 *
 * @example
 * ```bash
 * # Renew a deprecated version (no local applet directory required)
 * sos applet version renew --applet-uid my-applet-uid --applet-version 1.0.0
 *
 * # Renew without confirmation (scripting)
 * sos applet version renew --applet-uid my-applet-uid --applet-version 1.0.0 --yes
 * ```
 *
 * @throws {Error} When the version is not deprecated (409)
 * @throws {Error} When applet or organization access is denied
 *
 * @since 2.9.0
 */
export const appletVersionRenew = createCommandDefinition({
	name: 'renew',
	description: 'Renew (un-deprecate) an applet version',
	optionList: STATUS_OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof STATUS_OPTION_LIST>) {
		await runAppletVersionStatusAction('renew', options);
	},
});
