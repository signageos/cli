import { createCommandDefinition } from '../../Command/commandDefinition';
import { appletVersionPublish } from './Publish/appletVersionPublishCommand';
import { appletVersionDeprecate } from './Deprecate/appletVersionDeprecateCommand';
import { appletVersionRenew } from './Renew/appletVersionRenewCommand';

/**
 * Manages the lifecycle status of applet versions — publishing a built version,
 * deprecating a broken or obsolete one, and renewing (un-deprecating) it.
 *
 * @group Development:15
 *
 * @example
 * ```bash
 * # Publish a version
 * sos applet version publish --applet-uid my-applet-uid --applet-version 1.0.0
 *
 * # Deprecate a version
 * sos applet version deprecate --applet-uid my-applet-uid --applet-version 1.0.0
 *
 * # Renew (un-deprecate) a version
 * sos applet version renew --applet-uid my-applet-uid --applet-version 1.0.0
 * ```
 *
 * @since 2.9.0
 */
export const appletVersion = createCommandDefinition({
	name: 'version',
	description: 'Applet version lifecycle management',
	optionList: [],
	commands: [appletVersionPublish, appletVersionDeprecate, appletVersionRenew],
	async run() {
		throw new Error('Unknown command');
	},
});
