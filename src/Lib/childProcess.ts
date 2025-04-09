import * as child_process from 'child_process';

/**
 * Execute a child process command
 * @param command
 * @param verbose
 * @returns Promise<string>
 */
export const executeChildProcess = (command: string, verbose: boolean): Promise<string> => {
	return new Promise((resolve, reject) => {
		child_process.exec(command, (error, stdout, stderr) => {
			if (error) {
				reject(error);
			} else {
				if (verbose) {
					console.log(stdout);
					console.log(stderr);
				}
				resolve(stdout);
			}
		});
	});
};
