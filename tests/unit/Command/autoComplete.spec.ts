import should from 'should';
import { generateCompletionScript } from '../../../src/Command/autoComplete';
import { ICommand, OptionList } from '../../../src/Command/commandDefinition';

const command = (name: string, commands: ICommand<string, OptionList>[] = []): ICommand<string, OptionList> => ({
	name,
	description: `${name} description`,
	optionList: [],
	commands,
	run: async () => undefined,
});

const rootCommand = command('sos', [command('applet', [command('upload'), command('start')]), command('login')]);

describe('Command.autoComplete', function () {
	describe('generateCompletionScript', function () {
		it('should complete the top level commands', function () {
			should(generateCompletionScript(rootCommand)).match(/compgen -W "applet login"/);
		});

		it('should complete the subcommands of a nested command', function () {
			should(generateCompletionScript(rootCommand)).match(/"applet"\)\n\s*COMPREPLY=\( \$\(compgen -W "upload start"/);
		});

		it('should not leave the placeholder comment in the generated script', function () {
			should(generateCompletionScript(rootCommand)).not.match(/COMMAND_SCHEMA_CASES/);
		});
	});
});
