import { createCommandDefinition } from '../Command/commandDefinition';
import { skillInstall } from './Install/skillInstallCommand';

/**
 * Manages the bundled signageOS Agent Skill for AI coding agents.
 *
 * @group Tools:302
 *
 * @subcommands
 * - `install` - Copy the skill into the skills directory of Claude Code, Copilot CLI, Cursor or Codex
 *
 * @example
 * ```bash
 * sos skill install
 * ```
 *
 * @since 4.5.0
 */
export const skill = createCommandDefinition({
	name: 'skill',
	description: 'Agent skill management',
	optionList: [],
	commands: [skillInstall],
	async run() {
		throw new Error('Please use a subcommand: install');
	},
});
