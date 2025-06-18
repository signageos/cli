import * as fs from 'fs';
import * as path from 'path';
import { createCommandDefinition } from '../../commandDefinition';

export const OPTION_LIST = [] as const;

export const uninstallAutocomplete = createCommandDefinition({
	name: 'uninstall',
	description: 'Uninstall command auto-completion for bash/zsh shells',
	optionList: OPTION_LIST,
	commands: [],
	async run() {
		try {
			const homeDir = process.env.HOME || process.env.USERPROFILE || '';

			if (!homeDir) {
				console.error('Could not determine home directory for auto-completion uninstallation.');
				return;
			}

			// Path to the completion script
			const completionFilePath = path.join(homeDir, '.sos-completion.sh');

			// Remove completion script if it exists
			try {
				await fs.promises.access(completionFilePath);
				await fs.promises.unlink(completionFilePath);
				console.info(`✅ Removed completion script: ${completionFilePath}`);
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
					console.info(`ℹ️ Completion script not found at: ${completionFilePath}`);
				} else {
					throw error;
				}
			}

			// Check shell config files and remove the source line
			const shellConfigFiles = ['.zshrc', '.bashrc', '.bash_profile'];
			const sourceLine = `source ${completionFilePath}`;

			let configModified = false;
			for (const configFile of shellConfigFiles) {
				const configFilePath = path.join(homeDir, configFile);

				if (fs.existsSync(configFilePath)) {
					try {
						let content = fs.readFileSync(configFilePath, 'utf8');
						const originalContent = content;

						// Remove the source line and the comment above it
						const sourceLineWithComment = `# Added by signageOS CLI for tab completion\n${sourceLine}\n`;
						content = content.replace(sourceLineWithComment, '');

						// If the comment and source line pattern doesn't match exactly, try just the source line
						if (content === originalContent) {
							content = content.replace(new RegExp(`${sourceLine}\\n?`, 'g'), '');
						}

						if (content !== originalContent) {
							fs.writeFileSync(configFilePath, content, 'utf8');
							console.info(`✅ Removed source line from ${configFile}`);
							configModified = true;
						}
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : String(error);
						console.error(`Failed to modify ${configFile}:`, errorMessage);
					}
				}
			}

			if (!configModified) {
				console.info(`ℹ️ No shell configuration files were modified`);
			}

			console.info('\nAuto-completion for signageOS CLI has been uninstalled.');
			console.info('You may need to restart your terminal or run "source ~/.bashrc" (or equivalent) for changes to take effect.');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error('Error uninstalling auto-completion:', errorMessage);
		}
	},
});
