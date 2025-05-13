import { createCommandDefinition, ICommand, OptionList } from '../commandDefinition';
import { installAutocomplete, setRootCommand } from './Install/installAutocompleteCommand';
import { uninstallAutocomplete } from './Uninstall/uninstallAutocompleteCommand';

export const OPTION_LIST = [] as const;

// Function to initialize the autocomplete command with the root command reference
export const initializeAutocomplete = (rootCommand: ICommand<string, OptionList>): void => {
	setRootCommand(rootCommand);
};

export const autocomplete = createCommandDefinition({
	name: 'autocomplete',
	description: 'Commands for managing CLI auto-completion',
	optionList: OPTION_LIST,
	commands: [installAutocomplete, uninstallAutocomplete],
	async run() {
		throw new Error('Please use a subcommand: install, uninstall');
	},
});
