import * as path from 'path';
import { exec } from 'child-process-promise';
import { ExecOptions } from 'child_process';

export function execSosCommand(args: string[], options: ExecOptions = {}) {
	const { env, ...otherOptions } = options;
	const fullEnv = {
		...process.env,
		...env,
	};
	return exec(`ts-node ${path.join(__dirname, '..', '..', 'src', 'index.ts')} ${args.join(' ')}`, {
		...otherOptions,
		env: fullEnv,
	});
}
