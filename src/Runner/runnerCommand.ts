import { createCommandDefinition } from '../Command/commandDefinition';
import { runnerGenerate } from './Generate/runnerGenerateCommand';
import { runnerUpload } from './Upload/runnerUploadCommand';

/**
 * Runner management operations for developing and deploying signageOS runners.
 *
 * Runners are designed for continuous execution as background processes on devices.
 * Once activated, they run indefinitely with active health monitoring and automatic
 * restart capabilities for stability.
 *
 * Runners must implement `run`, `set`, and `get` methods.
 * Upload reads `.sosconfig.json` for configuration.
 *
 * @group Development:103
 *
 * @example
 * ```bash
 * # Generate new runner project
 * sos runner generate --name my-runner --description "Background service" --yes
 *
 * # Upload runner to platform
 * sos runner upload --yes
 * ```
 *
 * @since 2.6.0
 */
export const runner = createCommandDefinition({
	name: 'runner',
	description: 'Runner management',
	optionList: [],
	commands: [runnerGenerate, runnerUpload],
	async run() {
		throw new Error('Unknown command');
	},
});
