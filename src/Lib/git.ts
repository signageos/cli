import * as path from 'path';
import { executeChildProcess } from './childProcess';

export async function machineHasGit() {
	try {
		const result = await executeChildProcess('git --version', true);
		return result.includes('git version');
	} catch {
		return false;
	}
}

export async function throwErrorIfGitNotInstalled() {
	if (!(await machineHasGit())) {
		throw new Error('Git is not installed on this machine. Please install Git to use this feature.');
	}
}

export async function initGitRepository(relativePath: string, verbose: boolean = false) {
	const absolutePath = path.resolve(relativePath);
	await executeChildProcess(`git init "${absolutePath}"`, verbose);
}

export async function cloneGitRepository(gitUrl: string, targetDir: string) {
	const absolutePath = path.resolve(targetDir);
	await executeChildProcess(`git clone "${gitUrl}" "${absolutePath}"`, false);
}
