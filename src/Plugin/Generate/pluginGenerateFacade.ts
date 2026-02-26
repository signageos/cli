import chalk from 'chalk';
import prompts from 'prompts';
import * as path from 'path';
import * as fs from 'fs-extra';
import { log } from '@signageos/sdk/dist/Console/log';
import { cloneGitRepository } from '../../Lib/git';
import { CommandLineOptions } from '../../Command/commandDefinition';
import { OPTION_LIST } from './pluginGenerateOptions';

/**
 * Prompts the user for the parameters needed to generate a custom script.
 */
export async function askForParameters(options?: CommandLineOptions<typeof OPTION_LIST>, skipConfirmation = false) {
	const throwCanceledError = () => {
		throw new Error('Plugin generation was canceled.');
	};

	// Get values from CLI options if provided
	const nameFromOptions = options?.name;
	const descriptionFromOptions = options?.description;

	// Determine which prompts are needed
	const promisesToAsk = [];

	if (!nameFromOptions) {
		promisesToAsk.push({
			type: 'text' as const,
			name: 'name',
			message: 'Type name',
			min: 1,
		});
	}

	if (!descriptionFromOptions) {
		promisesToAsk.push({
			type: 'text' as const,
			name: 'description',
			message: 'Type description',
			min: 1,
		});
	}

	// Only prompt if we need values
	let promptResults: { name?: string; description?: string } = {};
	if (promisesToAsk.length > 0) {
		if (skipConfirmation && (nameFromOptions || descriptionFromOptions)) {
			// If in non-interactive mode but missing required parameters, throw error
			throw new Error('Missing required parameters. In non-interactive mode (--yes), you must provide --name and --description options.');
		}
		promptResults = await prompts(promisesToAsk, { onCancel: throwCanceledError });
	}

	// Use CLI options or prompt results
	const name = nameFromOptions || promptResults.name!;
	const description = descriptionFromOptions || promptResults.description!;
	const targetDir = name;

	log(
		'info',
		`Generating Plugin with these parameters:\n` +
			`  - Directory: ${chalk.green(targetDir)}\n` +
			`  - Name: ${chalk.green(name)}\n` +
			`  - Description: ${chalk.green(description)}\n`,
	);

	// Skip confirmation if in non-interactive mode
	if (!skipConfirmation) {
		const { confirm } = await prompts({
			type: 'confirm',
			name: 'confirm',
			message: 'Confirm',
		});

		if (!confirm) {
			throwCanceledError();
		}
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
	const URL = 'https://github.com/signageos/plugins-boilerplate';
	await cloneGitRepository(URL, targetDir);

	// we just want the code, not the git history
	await fs.remove(path.join(targetDir, '.git'));
}
