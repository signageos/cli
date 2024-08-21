import { OptionDefinition as ArgsOptionDefinition } from 'command-line-args';
import { OptionDefinition as UsageOptionDefinition } from 'command-line-usage';
import { GENERAL_OPTION_LIST } from '../generalCommand';

export type ICommandOption = Readonly<ArgsOptionDefinition & UsageOptionDefinition>;
export type OptionList = Readonly<ICommandOption[]>;

type GetNumberTypeByConstructor<T extends BooleanConstructor | StringConstructor | NumberConstructor> = T extends NumberConstructor
	? number
	: unknown;
type GetNumOrStrTypeByConstructor<T extends BooleanConstructor | StringConstructor | NumberConstructor> = T extends StringConstructor
	? string
	: GetNumberTypeByConstructor<T>;
type GetTypeByConstructor<T extends BooleanConstructor | StringConstructor | NumberConstructor> = T extends BooleanConstructor
	? boolean
	: GetNumOrStrTypeByConstructor<T>;

type ArrayIfMultiple<O, T> = O extends { multiple: true } ? T[] : T;

type OptionListWithGeneral<OL extends OptionList> = [...typeof GENERAL_OPTION_LIST, ...OL];

export type CommandLineOptions<OL extends OptionList> = {
	[P in OptionListWithGeneral<OL>[number]['name']]:
		| ArrayIfMultiple<
				Extract<OptionListWithGeneral<OL>[number], { name: P }>,
				GetTypeByConstructor<Extract<OptionListWithGeneral<OL>[number], { name: P }>['type']>
		  >
		| undefined;
};

export type ICommand<N extends string, OL extends OptionList> = {
	name: N;
	description: string;
	optionList: OL;
	commands: ICommand<string, OptionList>[];
	run(options: CommandLineOptions<OL>): Promise<void>;
};

export function createCommandDefinition<C extends ICommand<N, OL>, N extends string, OL extends Readonly<Readonly<ICommandOption>[]>>(
	def: C,
): C {
	return def;
}
