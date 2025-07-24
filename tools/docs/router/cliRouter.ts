import { parseCommand } from '../process/parseCommand.js';
import { logger } from '../utils/shared.js';
import type { CliCommand } from '../core/domain-types.js';
import * as ts from 'typescript';
import { DOCS_CONFIG } from '../config.js';

function shouldIncludeInDocs(command: CliCommand): boolean {
	// Skip commands marked with @group Private
	return command.jsDoc?.group !== DOCS_CONFIG.commands.privateGroupMarker;
}

/**
 * Parses CLI commands from TypeScript source files and generates documentation pages
 */
export function* cliRouter(program: ts.Program, checker: ts.TypeChecker): Generator<[string, CliCommand]> {
	const sourceFiles = program.getSourceFiles();

	// Find the main index file
	const indexFile = sourceFiles.find(
		(s) => !s.fileName.includes('node_modules') && s.fileName.endsWith('index.ts') && s.fileName.includes('src'),
	);

	if (!indexFile) {
		logger.debug(
			'Available source files:',
			sourceFiles.filter((f) => !f.fileName.includes('node_modules')).map((f) => f.fileName),
		);
		throw new Error('No main index.ts file found');
	}

	// Parse the main command and all subcommands
	const rootCommand = parseCommand(indexFile, checker, 'index');

	if (rootCommand) {
		// Calculate accumulated positions for the entire command tree
		calculateAccumulatedPositions(rootCommand, 0, 0);

		// For the root command, always use 'index' as the filename since it's the main entry point
		yield ['index', rootCommand];

		// Get all subcommands
		yield* generateSubcommandPages(rootCommand, '');
	} else {
		logger.warn('No root command found in index file');
	}
}

/**
 * Calculates hierarchical sidebar positions with configurable multipliers per level
 */
function calculateAccumulatedPositions(command: CliCommand, basePosition: number, level: number = 0): void {
	// Get this command's priority from JSDoc, default to 0 if not specified
	const rawPriority = command.jsDoc?.groupPriority || 0;

	// Apply multiplier based on hierarchy level
	let multipliedPriority: number;
	if (level === 0) {
		// Root level: multiply by configured root multiplier
		multipliedPriority = rawPriority * DOCS_CONFIG.sidebar.multipliers.root;
	} else if (level === 1) {
		// 1st level: multiply by configured first level multiplier
		multipliedPriority = rawPriority * DOCS_CONFIG.sidebar.multipliers.firstLevel;
	} else {
		// 2nd+ levels: multiply by configured second level multiplier
		multipliedPriority = rawPriority * DOCS_CONFIG.sidebar.multipliers.secondLevelAndUp;
	}

	// Set the accumulated position for this command: base + multiplied priority
	command.accumulatedPosition = basePosition + multipliedPriority;

	// Calculate positions for subcommands
	for (const subcommand of command.subcommands || []) {
		// Skip private commands
		if (!shouldIncludeInDocs(subcommand)) {
			continue;
		}

		// Recursively calculate for nested subcommands using this command's accumulated position
		calculateAccumulatedPositions(subcommand, command.accumulatedPosition, level + 1);
	}
}

/**
 * Generate documentation pages for all subcommands
 * @param command - Parent command
 * @param parentPath - Parent command path
 * @returns Generator of subcommand pages
 */
function* generateSubcommandPages(command: CliCommand, parentPath: string): Generator<[string, CliCommand]> {
	for (const subcommand of command.subcommands || []) {
		// Skip private commands
		if (!shouldIncludeInDocs(subcommand)) {
			continue;
		}

		const fullPath = parentPath ? `${parentPath}/${subcommand.name}` : subcommand.name;

		// Set the fullPath property on the subcommand object for CLI usage (with spaces instead of slashes)
		subcommand.fullPath = parentPath ? `${parentPath.replace(/\//g, ' ')} ${subcommand.name}` : subcommand.name;

		// Always use index.md within the command's folder
		const filePath = `${fullPath}/index`;

		yield [filePath, subcommand];

		// Recursively process nested subcommands
		yield* generateSubcommandPages(subcommand, fullPath);
	}
}
