import { OptionDefinition as ArgsOptionDefinition, CommandLineOptions } from "command-line-args";
import { OptionDefinition as UsageOptionDefinition } from "command-line-usage";

export type ICommandOption = ArgsOptionDefinition & UsageOptionDefinition;

export default interface ICommand {
	name: string;
	description: string;
	optionList: ICommandOption[];
	commands: ICommand[];
	run(options: CommandLineOptions): Promise<void>;
}
