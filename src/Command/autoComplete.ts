import * as fs from 'fs';
import * as path from 'path';
import { ICommand, OptionList } from './commandDefinition';

// Function to extract command structure for auto-completion
function buildCompletionSchema(
	command: ICommand<string, OptionList>,
	parentCommand: string = '',
	isRoot: boolean = true,
): Record<string, string[]> {
	const commandName = isRoot ? '' : parentCommand ? `${parentCommand} ${command.name}` : command.name;
	const result: Record<string, string[]> = {};

	// Add subcommands
	if (command.commands.length > 0) {
		result[commandName] = command.commands.map((cmd) => cmd.name);
	}

	// Add options
	const options = command.optionList.map((opt) => `--${opt.name}`);
	if (options.length > 0) {
		result[`${commandName} options`] = options;
	}

	// Process subcommands with a simpler approach
	for (const subCommand of command.commands) {
		const newParent = commandName || '';
		Object.assign(result, buildCompletionSchema(subCommand, newParent, false));
	}

	return result;
}

// Move the shell script to a separate file and dynamically read it
export function generateCompletionScript(rootCommand: ICommand<string, OptionList>): string {
	const commandSchema = buildCompletionSchema(rootCommand);
	const topLevelCommands = commandSchema[''] ? commandSchema[''].join(' ') : '';

	// Read the shell script from the file
	const scriptPath = path.resolve(__dirname, './Autocomplete/Install/sos-completion.sh');
	let script = fs.readFileSync(scriptPath, 'utf8');

	// Generate case statements for each command path
	let commandCases = '';
	for (const cmdPath in commandSchema) {
		if (cmdPath === '') {
			continue;
		} // Skip the top-level commands
		const subcommands = commandSchema[cmdPath] ? commandSchema[cmdPath].join(' ') : '';
		if (subcommands) {
			commandCases += `    "${cmdPath}")\n      COMPREPLY=( $(compgen -W "${subcommands}" -- "$cur") )\n      return 0\n      ;;\n`;
		}
	}

	// If no command cases were generated, add a comment to make the script valid
	if (!commandCases) {
		commandCases = '    # No subcommands available\n';
	}

	// Replace placeholders in the shell script
	script = script.replace(/\${TOPLEVEL_COMMANDS}/g, topLevelCommands);
	script = script.replace(/    # COMMAND_SCHEMA_CASES will be replaced with actual cases during generation/g, commandCases);

	return script;
}

export function installAutoCompletion(rootCommand: ICommand<string, OptionList>): boolean {
	try {
		const script = generateCompletionScript(rootCommand);
		const homeDir = process.env.HOME || process.env.USERPROFILE || '';

		if (!homeDir) {
			console.error('Could not determine home directory for auto-completion installation.');
			return false;
		}

		// Write completion script
		const completionFilePath = path.join(homeDir, '.sos-completion.sh');
		fs.writeFileSync(completionFilePath, script, 'utf8');
		fs.chmodSync(completionFilePath, '755');

		// Configure shell
		const sourceLine = `source ${completionFilePath}`;
		const configResult = configureShellFile(homeDir, sourceLine);

		// Display message
		displayInstallationMessage(completionFilePath, configResult);

		return configResult.configured;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error('Error installing auto-completion:', errorMessage);
		return false;
	}
}

// Helper functions for better organization
function configureShellFile(homeDir: string, sourceLine: string): { configured: boolean; file?: string; error?: string } {
	const shellConfigFiles = ['.zshrc', '.bashrc', '.bash_profile'];
	const activeShell = process.env.SHELL || '';

	// Try to prioritize the current shell's config file
	let orderedConfigFiles = [...shellConfigFiles];
	if (activeShell.includes('zsh')) {
		orderedConfigFiles = ['.zshrc', ...orderedConfigFiles.filter((f) => f !== '.zshrc')];
	} else if (activeShell.includes('bash')) {
		orderedConfigFiles = ['.bashrc', '.bash_profile', ...orderedConfigFiles.filter((f) => f !== '.bashrc' && f !== '.bash_profile')];
	}

	for (const configFile of orderedConfigFiles) {
		const configFilePath = path.join(homeDir, configFile);

		try {
			// Skip if file doesn't exist
			if (!fs.existsSync(configFilePath)) {
				continue;
			}

			// Skip if file isn't writable
			const stats = fs.statSync(configFilePath);
			// eslint-disable-next-line no-bitwise
			if ((stats.mode & 0o200) === 0) {
				continue;
			}

			const content = fs.readFileSync(configFilePath, 'utf8');
			// Check if already configured
			if (content.includes(sourceLine)) {
				return { configured: true, file: configFile };
			}

			// Add source line
			fs.appendFileSync(configFilePath, `\n# Added by signageOS CLI for tab completion\n${sourceLine}\n`);
			return { configured: true, file: configFile };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error(`Failed to configure ${configFile}:`, errorMessage);
		}
	}

	// No config file found or configured
	return {
		configured: false,
		error: `No suitable shell configuration file found or accessible in ${homeDir}`,
	};
}

function displayInstallationMessage(completionFilePath: string, config: { configured: boolean; file?: string; error?: string }): void {
	// Base message for all scenarios
	const message = ['Auto-completion for signageOS CLI:', `✅ Script installed at: ${completionFilePath}`];

	// Add configuration status
	if (config.configured) {
		message.push(`✅ Source line added to your ${config.file}`);
		message.push('\nTo start using tab completion right away, run:');
		message.push(`    source ${completionFilePath}`);
	} else {
		message.push('❌ Could not automatically configure your shell');
		if (config.error) {
			message.push(`   Reason: ${config.error}`);
		}
		message.push('\nTo enable tab completion, add this line to your shell config:');
		message.push(`    source ${completionFilePath}`);
	}

	// Add usage examples
	message.push('\nUsage examples:');
	message.push('    sos [TAB]          # Show all top-level commands');
	message.push('    sos applet [TAB]   # Show all applet subcommands');

	console.log(message.join('\n'));
}

// Create a standalone completion setup command
export function setupCompletion(rootCommand: ICommand<string, OptionList>): boolean {
	return installAutoCompletion(rootCommand);
}
