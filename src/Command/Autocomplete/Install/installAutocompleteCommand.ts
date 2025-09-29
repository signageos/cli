import { createCommandDefinition, ICommand, OptionList } from '../../commandDefinition';
import { installAutoCompletion } from '../../autoComplete';

export const OPTION_LIST = [] as const;

// Root command reference that will be populated when the command is registered
let rootCommandRef: ICommand<string, OptionList> | null = null;

// Setter function to provide the root command reference
export const setRootCommand = (rootCommand: ICommand<string, OptionList>): void => {
	rootCommandRef = rootCommand;
};

/**
 * Enables auto-completion functionality for the signageOS CLI in supported shells.
 * This command adds auto-completion scripts and configuration to the user's shell
 * profile, allowing tab completion for commands and sub-commands.
 *
 * @group Tools:11
 *
 * @example
 * ```bash
 * # Install auto-completion
 * sos autocomplete install
 * ```
 *
 * @see {@link ../uninstall/ Uninstall auto-completion command}
 *
 * @since 2.4.0
 */
export const installAutocomplete = createCommandDefinition({
	name: 'install',
	description: 'Install command auto-completion for bash/zsh shells',
	optionList: OPTION_LIST,
	commands: [],
	async run() {
		// Get the root command from the reference set during initialization
		const rootCommand = rootCommandRef;

		if (!rootCommand) {
			throw new Error('Root command not found. Please make sure the CLI is properly initialized.');
		}

		// Install the auto-completion script
		installAutoCompletion(rootCommand);
	},
});
