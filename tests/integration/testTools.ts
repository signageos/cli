import { exec } from 'child-process-promise';
import { ExecOptions } from 'child_process';
import * as path from 'path';

// Find the CLI root directory (where package.json with @signageos/cli is located)
// This ensures we always reference the correct CLI source regardless of cwd changes
const findCliRoot = (): string => {
	let currentDir = __dirname;
	while (currentDir !== path.parse(currentDir).root) {
		const packageJsonPath = path.join(currentDir, 'package.json');
		try {
			const packageJson = require(packageJsonPath);
			if (packageJson.name === '@signageos/cli') {
				return currentDir;
			}
		} catch {
			// Continue searching up the directory tree
		}
		currentDir = path.dirname(currentDir);
	}
	throw new Error('Could not find CLI root directory');
};

const CLI_ROOT = findCliRoot();

export function execSosCommand(args: string[], options: ExecOptions = {}) {
	const { env, ...otherOptions } = options;
	const fullEnv = {
		...process.env,
		...env,
	};
	const cliIndexPath = path.join(CLI_ROOT, 'src', 'index.ts');
	return exec(`ts-node ${cliIndexPath} ${args.join(' ')}`, {
		...otherOptions,
		env: fullEnv,
	});
}
