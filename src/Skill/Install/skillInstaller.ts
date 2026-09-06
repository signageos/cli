import * as path from 'path';
import * as fs from 'fs-extra';

export const SKILL_NAME = 'signageos';

/** Agents that load Agent Skills from a per-user directory, and where that directory is. */
export const KNOWN_AGENTS = {
	claude: { home: '.claude', skills: path.join('.claude', 'skills') },
	copilot: { home: '.copilot', skills: path.join('.copilot', 'skills') },
	cursor: { home: '.cursor', skills: path.join('.cursor', 'skills') },
	codex: { home: '.codex', skills: path.join('.codex', 'skills') },
} as const;

export type AgentName = keyof typeof KNOWN_AGENTS;

export interface IInstallTarget {
	agent: AgentName | 'dir';
	dir: string;
}

function isKnownAgent(name: string): name is AgentName {
	return Object.hasOwn(KNOWN_AGENTS, name);
}

/**
 * Explicit --dir and/or explicitly named agents when given; otherwise every known agent
 * whose home directory exists under homeDir.
 */
export async function resolveTargets(
	homeDir: string,
	agents: readonly string[] | undefined,
	explicitDir: string | undefined,
): Promise<IInstallTarget[]> {
	const targets: IInstallTarget[] = [];
	if (explicitDir) {
		targets.push({ agent: 'dir', dir: path.resolve(explicitDir, SKILL_NAME) });
	}
	const explicit = !!agents && agents.length > 0;
	const names = explicit ? agents : explicitDir ? [] : Object.keys(KNOWN_AGENTS);
	for (const name of names) {
		if (!isKnownAgent(name)) {
			throw new Error(`Unknown agent "${name}". Known agents: ${Object.keys(KNOWN_AGENTS).join(', ')}`);
		}
		if (explicit || (await fs.pathExists(path.join(homeDir, KNOWN_AGENTS[name].home)))) {
			targets.push({ agent: name, dir: path.join(homeDir, KNOWN_AGENTS[name].skills, SKILL_NAME) });
		}
	}
	return targets;
}

/** Copies the bundled skill directory into the target (overwriting) and records which CLI version installed it. */
export async function installSkill(sourceDir: string, target: IInstallTarget, cliVersion: string): Promise<void> {
	await fs.ensureDir(target.dir);
	await fs.copy(sourceDir, target.dir, { overwrite: true });
	await fs.writeJson(path.join(target.dir, 'INSTALLED.json'), { cliVersion, installedAt: new Date().toISOString() }, { spaces: 2 });
}
