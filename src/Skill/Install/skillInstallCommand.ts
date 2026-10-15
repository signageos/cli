import * as os from 'os';
import * as path from 'path';
import chalk from 'chalk';
import { log } from '@signageos/sdk/dist/Console/log';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { parameters } from '../../parameters';
import { installSkill, KNOWN_AGENTS, resolveTargets, SKILL_NAME } from './skillInstaller';

export const AGENT_OPTION = {
	name: 'agent',
	type: String,
	multiple: true,
	description: 'Agent to install for: claude, copilot, cursor, codex. Repeatable. Default: every agent whose home directory exists',
} as const;
export const DIR_OPTION = {
	name: 'dir',
	type: String,
	description: 'Skills directory to install into instead (the skill lands in <dir>/signageos)',
} as const;

const OPTION_LIST = [AGENT_OPTION, DIR_OPTION] as const;

/** The bundled skill: src/Skill/signageos in sources, dist/Skill/signageos after build (copied by tools/include-templates.mjs). */
export const SKILL_SOURCE_DIR = path.resolve(__dirname, '..', SKILL_NAME);

/**
 * Installs the bundled `signageos` Agent Skill into the per-user skills directory of
 * every supported coding agent found on this machine (Claude Code `~/.claude/skills`,
 * GitHub Copilot CLI `~/.copilot/skills`, Cursor `~/.cursor/skills`, Codex `~/.codex/skills`).
 * The skill teaches the agent to operate signageOS screens through `sos` commands:
 * preflight checks, guardrails, and runbooks for finding devices, checking status,
 * screenshots, reboot/reload, putting an applet on a screen and diagnosing a screen.
 *
 * Files are copied, not linked, so it works on Windows. Re-run after updating the CLI
 * to refresh the skill; `INSTALLED.json` in the target records the CLI version.
 *
 * @group Tools:302
 *
 * @example
 * ```bash
 * # Install for every agent found on this machine
 * sos skill install
 *
 * # Only for Claude Code and Cursor
 * sos skill install --agent claude --agent cursor
 *
 * # Into a project-level skills folder
 * sos skill install --dir ./.claude/skills
 * ```
 *
 * @throws {Error} When no agent directory is found and neither --agent nor --dir is given
 *
 * @since 4.5.0
 */
export const skillInstall = createCommandDefinition({
	name: 'install',
	description: 'Install the signageOS agent skill into Claude Code, Copilot CLI, Cursor or Codex',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const homeDir = os.homedir();
		const targets = await resolveTargets(homeDir, options.agent, options.dir);
		if (targets.length === 0) {
			const homes = Object.values(KNOWN_AGENTS)
				.map((agent) => agent.home)
				.join(', ');
			throw new Error(`No agent directory (${homes}) found in ${homeDir}. Use --agent <name> or --dir <path>.`);
		}
		for (const target of targets) {
			await installSkill(SKILL_SOURCE_DIR, target, parameters.version);
			log('info', chalk.green(`Installed skill "${SKILL_NAME}" for ${target.agent}: ${target.dir}`));
		}
		log('info', 'Next: open your agent and say "run the signageOS preflight".');
	},
});
