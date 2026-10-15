import { createCommandDefinition } from '../Command/commandDefinition';
import { docsSearch } from './Search/docsSearchCommand';

/**
 * Looks things up in the public signageOS documentation.
 *
 * @group Tools:303
 *
 * @subcommands
 * - `search` - Semantic search over docs.signageos.io, results as JSON
 *
 * @example
 * ```bash
 * sos docs search --query "applet timing configuration"
 * ```
 *
 * @since 4.5.0
 */
export const docs = createCommandDefinition({
	name: 'docs',
	description: 'Documentation lookup',
	optionList: [],
	commands: [docsSearch],
	async run() {
		throw new Error('Please use a subcommand: search');
	},
});
