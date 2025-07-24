import { createCommandDefinition, ICommand, OptionList } from '../commandDefinition';
import { installAutocomplete, setRootCommand } from './Install/installAutocompleteCommand';
import { uninstallAutocomplete } from './Uninstall/uninstallAutocompleteCommand';

export const OPTION_LIST = [] as const;

// Function to initialize the autocomplete command with the root command reference
export const initializeAutocomplete = (rootCommand: ICommand<string, OptionList>): void => {
	setRootCommand(rootCommand);
};

/**
 * Provides commands for installing and managing shell auto-completion for the signageOS CLI.
 * Auto-completion enhances developer productivity by providing intelligent command and
 * sub-command suggestions in supported shells (bash, zsh, fish).
 *
 * @group Tools:7
 *
 * @example
 * ```bash
 * # Install auto-completion for current shell
 * sos autocomplete install
 *
 * # Uninstall auto-completion
 * sos autocomplete uninstall
 * ```
 *
 * @since 2.4.0
 */
export const autocomplete = createCommandDefinition({
	name: 'autocomplete',
	description: 'CLI auto-completion management',
	optionList: OPTION_LIST,
	commands: [installAutocomplete, uninstallAutocomplete],
	async run() {
		throw new Error('Please use a subcommand: install, uninstall');
	},
});
