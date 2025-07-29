import * as ts from 'typescript';
import { isVariableWithName, isExportAssignmentWithName, getCommandDefinitionObject } from './utils/astUtils.js';
import { getPropertyValue } from './utils/valueExtractor.js';
import { extractJSDoc } from './utils/jsdocProcessor.js';
import { parseOptions } from './utils/optionParser.js';
import { extractFunctionParameters } from './utils/parameterExtractor.js';
import type { CliCommand, CliCommandOption, ParameterInfo } from '../core/domain-types.js';

/**
 * Parses CLI commands from TypeScript source files using AST analysis
 */
export function parseCommand(sourceFile: ts.SourceFile, checker: ts.TypeChecker, commandName: string): CliCommand | null {
	let command: CliCommand | null = null;

	ts.forEachChild(sourceFile, (node) => {
		if (command) {
			return;
		} // Early exit if command found

		// Handle variable statements
		if (ts.isVariableStatement(node) && isVariableWithName(node, commandName)) {
			const declaration = node.declarationList.declarations.find(
				(decl) => ts.isIdentifier(decl.name) && (decl.name.text === commandName || decl.name.text === 'index') && decl.initializer,
			);

			if (declaration) {
				command = parseCommandDefinition(declaration.initializer!, checker, sourceFile);
				if (command) {
					extractAndMergeJSDoc(declaration, command);
				}
			}
		}
		// Handle export assignments
		else if (ts.isExportAssignment(node) && isExportAssignmentWithName(node, commandName)) {
			command = parseCommandDefinition(node.expression, checker, sourceFile);
			if (command) {
				extractAndMergeJSDoc(node, command);
			}
		}
	});

	return command;
}

function parseCommandDefinition(node: ts.Node, checker: ts.TypeChecker, sourceFile: ts.SourceFile): CliCommand | null {
	const objectLiteral = getCommandDefinitionObject(node);
	if (!objectLiteral) {
		return null;
	}

	const command: CliCommand = {
		name: getCommandName(objectLiteral),
		description: getCommandDescription(objectLiteral),
		usage: getCommandUsage(objectLiteral),
		examples: getCommandExamples(objectLiteral),
		options: getCommandOptions(objectLiteral, sourceFile, checker),
		parameters: getCommandParameters(sourceFile, checker),
		subcommands: getCommandSubcommands(objectLiteral, sourceFile, checker),
		sourceFile: sourceFile.fileName,
	};

	return command;
}

function getCommandName(objectLiteral: ts.ObjectLiteralExpression): string {
	for (const property of objectLiteral.properties) {
		if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name) && property.name.text === 'name') {
			return getPropertyValue(property.initializer);
		}
	}
	return '';
}

/**
 * Extract command description from object literal
 */
function getCommandDescription(objectLiteral: ts.ObjectLiteralExpression): string {
	for (const property of objectLiteral.properties) {
		if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name) && property.name.text === 'description') {
			return getPropertyValue(property.initializer);
		}
	}
	return '';
}

function getCommandUsage(objectLiteral: ts.ObjectLiteralExpression): string | undefined {
	for (const property of objectLiteral.properties) {
		if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name) && property.name.text === 'usage') {
			return getPropertyValue(property.initializer);
		}
	}
	return undefined;
}

function getCommandExamples(objectLiteral: ts.ObjectLiteralExpression): string | undefined {
	for (const property of objectLiteral.properties) {
		if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name) && property.name.text === 'examples') {
			return getPropertyValue(property.initializer);
		}
	}
	return undefined;
}

function getCommandOptions(
	objectLiteral: ts.ObjectLiteralExpression,
	sourceFile: ts.SourceFile,
	checker: ts.TypeChecker,
): CliCommandOption[] {
	for (const property of objectLiteral.properties) {
		if (
			ts.isPropertyAssignment(property) &&
			ts.isIdentifier(property.name) &&
			(property.name.text === 'options' || property.name.text === 'optionList')
		) {
			return parseOptions(property.initializer, sourceFile, checker);
		}
	}
	return [];
}

function getCommandParameters(sourceFile: ts.SourceFile, checker: ts.TypeChecker): ParameterInfo[] {
	return extractFunctionParameters(sourceFile, checker);
}

function getCommandSubcommands(
	objectLiteral: ts.ObjectLiteralExpression,
	sourceFile: ts.SourceFile,
	checker: ts.TypeChecker,
): CliCommand[] {
	for (const property of objectLiteral.properties) {
		if (
			ts.isPropertyAssignment(property) &&
			ts.isIdentifier(property.name) &&
			(property.name.text === 'subcommands' || property.name.text === 'commands')
		) {
			if (ts.isArrayLiteralExpression(property.initializer)) {
				return parseSubcommandArray(property.initializer, sourceFile, checker);
			}
		}
	}
	return [];
}

function parseSubcommandArray(arrayNode: ts.ArrayLiteralExpression, sourceFile: ts.SourceFile, checker: ts.TypeChecker): CliCommand[] {
	const subcommands: CliCommand[] = [];

	for (const element of arrayNode.elements) {
		if (ts.isObjectLiteralExpression(element)) {
			const subcommand = parseCommandFromObject(element, checker, sourceFile);
			if (subcommand) {
				subcommands.push(subcommand);
			}
		} else if (ts.isIdentifier(element)) {
			// Handle imported command references like 'applet', 'login', etc.
			const importedCommand = resolveImportedCommand(element, checker);
			if (importedCommand) {
				subcommands.push(importedCommand);
			}
		}
	}

	return subcommands;
}

/**
 * Resolves imported commands by following import symbols to their source files
 */
function resolveImportedCommand(identifier: ts.Identifier, checker: ts.TypeChecker): CliCommand | null {
	const symbol = checker.getSymbolAtLocation(identifier);
	if (!symbol) {
		return null;
	}

	// Resolve aliased symbols (imports) - this is crucial for imported symbols
	// Bitwise check for alias flag is intentional here - using comparison to satisfy eslint
	// eslint-disable-next-line no-bitwise
	const resolvedSymbol = (symbol.flags & ts.SymbolFlags.Alias) > 0 ? checker.getAliasedSymbol(symbol) : symbol;

	// Follow the symbol to its declaration
	const declaration = resolvedSymbol.valueDeclaration;
	if (!declaration) {
		return null;
	}

	// Get the source file where the command is defined
	const commandSourceFile = declaration.getSourceFile();

	// Parse the command from that source file using the identifier name
	// The exported variable name should match the identifier
	const commandName = identifier.text;
	const command = parseCommand(commandSourceFile, checker, commandName);

	return command;
}

/**
 * Parse command from object literal
 */
function parseCommandFromObject(
	objectLiteral: ts.ObjectLiteralExpression,
	checker: ts.TypeChecker,
	sourceFile: ts.SourceFile,
): CliCommand | null {
	return {
		name: getCommandName(objectLiteral),
		description: getCommandDescription(objectLiteral),
		usage: getCommandUsage(objectLiteral),
		examples: getCommandExamples(objectLiteral),
		options: getCommandOptions(objectLiteral, sourceFile, checker),
		parameters: [], // No function parameters in object literals
		subcommands: getCommandSubcommands(objectLiteral, sourceFile, checker),
		sourceFile: sourceFile.fileName,
	};
}

/**
 * Extract and merge JSDoc information into command
 * @param node - AST node with potential JSDoc
 * @param command - Command to merge JSDoc into
 */
function extractAndMergeJSDoc(node: ts.Node, command: CliCommand): void {
	const jsDoc = extractJSDoc(node);
	if (jsDoc) {
		command.jsDoc = jsDoc;

		// Use JSDoc description as fallback if no definition description exists
		if (!command.description && jsDoc.longDescription) {
			command.description = jsDoc.longDescription;
		}
	}
}
