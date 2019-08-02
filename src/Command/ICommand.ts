import { OptionDefinition as ArgsOptionDefinition, CommandLineOptions } from "command-line-args";
import { OptionDefinition as UsageOptionDefinition } from "command-line-usage";

export default interface ICommand {
	name: string;
	optionList: (ArgsOptionDefinition & UsageOptionDefinition)[];
	commands: ICommand[];
	run(options: CommandLineOptions): Promise<void>;
}
