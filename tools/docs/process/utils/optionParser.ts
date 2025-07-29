import * as ts from 'typescript';
import { resolveSymbol, getArrayElementsFromSymbol, getObjectLiteralFromSymbol } from './symbolResolver.js';
import { parseObjectLiteral } from './valueExtractor.js';
import type { CliCommandOption as CommandOption } from '../../core/domain-types.js';

function toCommandOption(parsed: Record<string, string>): CommandOption {
	return {
		name: parsed.name || '',
		type: parsed.type || 'string',
		alias: parsed.alias,
		description: parsed.description,
		required: parsed.required === 'true',
		default: parsed.default || parsed.defaultValue,
		choices: parsed.choices ? parsed.choices.split(',').map((c) => c.trim()) : undefined,
		examples: parsed.examples ? parsed.examples.split(',').map((e) => e.trim()) : undefined,
		deprecated: parsed.deprecated === 'true',
		hidden: parsed.hidden === 'true',
	};
}

/**
 * Parses options from AST nodes, handling arrays, identifiers, and import references
 */
export function parseOptions(node: ts.Node, sourceFile: ts.SourceFile, checker: ts.TypeChecker): CommandOption[] {
	if (ts.isArrayLiteralExpression(node)) {
		return parseOptionsFromArray(node, checker);
	}

	// Handle 'as const' expressions by unwrapping them
	if (ts.isAsExpression(node)) {
		return parseOptions(node.expression, sourceFile, checker);
	}

	// Handle identifier references (like OPTION_LIST)
	if (ts.isIdentifier(node)) {
		const symbol = checker.getSymbolAtLocation(node);

		// Resolve aliased symbols (imports)
		const resolvedSymbol = resolveSymbol(symbol, checker);

		if (resolvedSymbol?.valueDeclaration) {
			const declaration = resolvedSymbol.valueDeclaration;
			if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
				// Get the source file where the OPTION_LIST is declared
				const declarationSourceFile = declaration.getSourceFile();

				// If the initializer is an array literal, parse it directly
				if (ts.isArrayLiteralExpression(declaration.initializer)) {
					// Use the source file where the array is declared, not the current one
					return parseOptionsFromArray(declaration.initializer, checker);
				}
				// Otherwise, recursively parse the initializer (handles 'as const' etc.)
				return parseOptions(declaration.initializer, declarationSourceFile, checker);
			}
		}
	}

	return [];
}

function parseOptionsFromArrayElements(elements: readonly ts.Expression[], checker: ts.TypeChecker): CommandOption[] {
	const options: CommandOption[] = [];

	for (const element of elements) {
		if (ts.isObjectLiteralExpression(element)) {
			// Direct object literal
			const parsed = parseObjectLiteral(element);
			options.push(toCommandOption(parsed));
		} else if (ts.isIdentifier(element)) {
			// Reference to imported option
			const importedOption = resolveImportedOption(element, checker);
			if (importedOption) {
				options.push(importedOption);
			}
		} else if (ts.isSpreadElement(element) && ts.isIdentifier(element.expression)) {
			// Spread operator like ...GENERAL_OPTION_LIST
			const spreadOptions = resolveSpreadOptions(element.expression, checker);
			options.push(...spreadOptions);
		}
	}

	return options;
}

/**
 * Parse options from an array literal expression
 * @param arrayNode - Array literal node
 * @param sourceFile - Source file containing the array
 * @param checker - TypeScript type checker
 * @returns Array of command options
 */
function parseOptionsFromArray(arrayNode: ts.ArrayLiteralExpression, checker: ts.TypeChecker): CommandOption[] {
	return parseOptionsFromArrayElements(arrayNode.elements, checker);
}

/**
 * Resolve an imported option by following the import
 * @param identifier - Identifier to resolve
 * @param sourceFile - Source file containing the identifier
 * @param checker - TypeScript type checker
 * @returns Command option or null
 */
function resolveImportedOption(identifier: ts.Identifier, checker: ts.TypeChecker): CommandOption | null {
	const symbol = checker.getSymbolAtLocation(identifier);
	if (!symbol) {
		return null;
	}

	const resolvedSymbol = resolveSymbol(symbol, checker);
	if (!resolvedSymbol) {
		return null;
	}

	const objectLiteral = getObjectLiteralFromSymbol(resolvedSymbol);
	if (!objectLiteral) {
		return null;
	}

	const parsed = parseObjectLiteral(objectLiteral);
	const option = toCommandOption(parsed);
	return option;
}

/**
 * Resolve spread options like ...GENERAL_OPTION_LIST
 * @param identifier - Identifier in spread expression
 * @param sourceFile - Source file containing the identifier
 * @param checker - TypeScript type checker
 * @returns Array of command options
 */
function resolveSpreadOptions(identifier: ts.Identifier, checker: ts.TypeChecker): CommandOption[] {
	const symbol = checker.getSymbolAtLocation(identifier);
	if (!symbol) {
		return [];
	}

	const resolvedSymbol = resolveSymbol(symbol, checker);
	if (!resolvedSymbol) {
		return [];
	}

	const elements = getArrayElementsFromSymbol(resolvedSymbol);
	if (elements) {
		return parseOptionsFromArrayElements(elements, checker);
	}

	return [];
}
