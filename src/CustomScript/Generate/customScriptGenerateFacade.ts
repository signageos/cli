import chalk from 'chalk';
import prompts from 'prompts';
import * as path from 'path';
import * as fs from 'fs-extra';
import { log } from '@signageos/sdk/dist/Console/log';
import { cloneGitRepository } from '../../Lib/git';
import { CommandLineOptions } from '../../Command/commandDefinition';
import { OPTION_LIST } from './customScriptGenerateOptions';

/**
 * Prompts the user for the parameters needed to generate a custom script.
 */
export async function askForParameters(options?: CommandLineOptions<typeof OPTION_LIST>, skipConfirmation = false) {
	const throwCanceledError = () => {
		throw new Error('Custom Script generation was canceled.');
	};

	// Get values from options or prompt for them
	let name = options?.name;
	let description = options?.description;
	let dangerLevel = options?.['danger-level'];

	// Validate danger level if provided
	const validDangerLevels = ['low', 'medium', 'high', 'critical'];
	if (dangerLevel && !validDangerLevels.includes(dangerLevel)) {
		throw new Error(`Invalid danger level '${dangerLevel}'. Must be one of: ${validDangerLevels.join(', ')}`);
	}

	// Only prompt for missing values
	const promptQuestions: prompts.PromptObject[] = [];

	if (!name) {
		promptQuestions.push({
			type: 'text',
			name: 'name',
			message: 'Type name',
		});
	}

	if (!description) {
		promptQuestions.push({
			type: 'text',
			name: 'description',
			message: 'Type description',
		});
	}

	if (!dangerLevel) {
		promptQuestions.push({
			type: 'select',
			name: 'dangerLevel',
			message: 'Select danger level',
			choices: [
				{ title: 'Low', value: 'low' },
				{ title: 'Medium', value: 'medium' },
				{ title: 'High', value: 'high' },
				{ title: 'Critical', value: 'critical' },
			],
		});
	}

	// Only prompt if there are questions to ask
	if (promptQuestions.length > 0) {
		const responses = await prompts(promptQuestions, { onCancel: throwCanceledError });
		name = name || responses.name;
		description = description || responses.description;
		dangerLevel = dangerLevel || responses.dangerLevel;
	}

	// Validate all required fields are present
	if (!name) {
		throw new Error('Name is required. Provide it via --name option or interactively.');
	}
	if (!description) {
		throw new Error('Description is required. Provide it via --description option or interactively.');
	}
	if (!dangerLevel) {
		throw new Error('Danger level is required. Provide it via --danger-level option or interactively.');
	}

	const targetDir = name;

	log(
		'info',
		`Generating Custom Script with these parameters:\n` +
			`  - Directory: ${chalk.green(targetDir)}\n` +
			`  - Name: ${chalk.green(name)}\n` +
			`  - Description: ${chalk.green(description)}\n` +
			`  - Danger Level: ${chalk.green(dangerLevel)}\n`,
	);

	// Skip confirmation if --yes flag is used
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
		dangerLevel,
	};
}

/**
 * Downloads the latest version of the boilerplate code from the GitHub repository.
 */
export async function downloadBoilerplateCode(targetDir: string) {
	const URL = 'https://github.com/signageos/custom-scripts-boilerplate.git';
	await cloneGitRepository(URL, targetDir);

	// we just want the code, not the git history
	await fs.remove(path.join(targetDir, '.git'));
}
