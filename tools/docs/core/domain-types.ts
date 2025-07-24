/**
 * Core domain types for the docs generator
 */
export interface JSDocInfo {
	readonly longDescription?: string;
	readonly examples?: readonly string[] | string;
	readonly remarks?: string;
	readonly since?: string;
	readonly version?: string;
	readonly author?: string;
	readonly deprecated?: string;
	readonly group?: string;
	readonly groupPriority?: number;
	readonly see?: readonly LinkInfo[];
	readonly throws?: readonly ThrowsInfo[];
	readonly tags?: Record<string, unknown>;
}
export interface LinkInfo {
	readonly url: string;
	readonly text: string;
	readonly type?: 'external' | 'internal' | 'command';
}

export interface LinkValidationResult {
	type: 'external' | 'internal' | 'invalid';
	resolved: string;
	exists?: boolean;
}

export interface LinkCounts {
	internal: number;
	external: number;
}

export interface ThrowsInfo {
	readonly type: string;
	readonly description: string;
}

export interface ParameterInfo {
	readonly name: string;
	readonly type: string;
	readonly description: string;
	readonly default?: unknown;
	readonly optional?: boolean;
	readonly required?: boolean;
}
export interface CliCommand {
	name: string;
	description?: string;
	fullPath?: string;
	examples?: string;
	usage?: string;
	definitionDescription?: string;
	sourceFile?: string;
	accumulatedPosition?: number;
	options: CliCommandOption[];
	parameters: ParameterInfo[];
	subcommands: CliCommand[];
	jsDoc?: JSDocInfo;
}

export interface CliCommandOption {
	name: string;
	type: string;
	description?: string;
	alias?: string;
	default?: unknown;
	required?: boolean;
	choices?: string[];
	examples?: string[];
	deprecated?: boolean;
	hidden?: boolean;
}
