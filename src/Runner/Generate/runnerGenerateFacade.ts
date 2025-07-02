import chalk from 'chalk';
import prompts from 'prompts';
import * as path from 'path';
import * as fs from 'fs-extra';
import { log } from '@signageos/sdk/dist/Console/log';
import { cloneGitRepository } from '../../Lib/git';

/**
 * Prompts the user for the parameters needed to generate a runner.
 */
export async function askForParameters() {
	const throwCanceledError = () => {
		throw new Error('Runner generation was canceled.');
	};

	const { name, description } = await prompts(
		[
			{
				type: 'text',
				name: 'name',
				message: 'Type name',
			},
			{
				type: 'text',
				name: 'description',
				message: 'Type description',
			},
		],
		{ onCancel: throwCanceledError },
	);

	const targetDir = name;

	log(
		'info',
		`Generating Runner with these parameters:\n` +
			`  - Directory: ${chalk.green(targetDir)}\n` +
			`  - Name: ${chalk.green(name)}\n` +
			`  - Description: ${chalk.green(description)}\n`
	);

	const { confirm } = await prompts({
		type: 'confirm',
		name: 'confirm',
		message: 'Confirm',
	});

	if (!confirm) {
		throwCanceledError();
	}

	return {
		targetDir,
		name,
		description,
	};
}

/**
 * Downloads the latest version of the boilerplate code from the GitHub repository.
 */
export async function downloadBoilerplateCode(targetDir: string) {
	// TODO: Update this URL to point to the actual runner boilerplate repository
	const URL = 'https://github.com/signageos/custom-scripts-boilerplate.git';
	await cloneGitRepository(URL, targetDir);

	// we just want the code, not the git history
	await fs.remove(path.join(targetDir, '.git'));
}
