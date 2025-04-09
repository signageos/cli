import * as path from 'path';
import { executeChildProcess } from './childProcess';

export async function machineHasGit() {
	try {
		const result = await executeChildProcess('which git', true);
		return result.includes('/git');
	} catch (error) {
		return false;
	}
}

export async function initGitRepository(relativePath: string) {
	const absolutePath = path.resolve(relativePath);
	await executeChildProcess(`git init "${absolutePath}"`, false);
}
