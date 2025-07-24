import * as ts from 'typescript';
import type { ParameterInfo } from '../../core/domain-types.js';

interface ExtractedParameter {
	name: string;
	type: string;
	optional: boolean;
	description: string;
}

type RunFunctionType = ts.MethodDeclaration | ts.FunctionExpression | ts.ArrowFunction;

/**
 * Extracts parameter information from TypeScript function signatures in command definitions
 */
export function extractFunctionParameters(sourceFile: ts.SourceFile, checker: ts.TypeChecker): ParameterInfo[] {
	const parameters: ParameterInfo[] = [];

	// Find the run function in the command definition
	const runFunction = findRunFunction(sourceFile);
	if (!runFunction) {
		return parameters;
	}

	// Extract parameters from the function signature
	if (runFunction.parameters) {
		for (const param of runFunction.parameters) {
			const paramInfo = extractParameterInfo(param, checker);
			if (paramInfo) {
				parameters.push(toCommandParameter(paramInfo));
			}
		}
	}

	return parameters;
}

function toCommandParameter(param: ExtractedParameter): ParameterInfo {
	return {
		name: param.name,
		type: param.type,
		description: param.description,
		required: !param.optional,
		default: undefined,
	};
}

function findRunFunction(sourceFile: ts.SourceFile): RunFunctionType | null {
	function visitNode(node: ts.Node): RunFunctionType | null {
		if (isCreateCommandDefinitionCall(node)) {
			const foundFunction = findRunFunctionInCall(node);
			if (foundFunction) {
				return foundFunction;
			}
		}

		for (const child of node.getChildren()) {
			const result = visitNode(child);
			if (result) {
				return result;
			}
		}

		return null;
	}

	return visitNode(sourceFile);
}

/**
 * Check if node is a createCommandDefinition call
 */
function isCreateCommandDefinitionCall(node: ts.Node): node is ts.CallExpression {
	return ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'createCommandDefinition';
}

/**
 * Find run function within a createCommandDefinition call
 */
function findRunFunctionInCall(node: ts.CallExpression): RunFunctionType | null {
	const firstArg = node.arguments[0];
	if (!firstArg || !ts.isObjectLiteralExpression(firstArg)) {
		return null;
	}

	for (const property of firstArg.properties) {
		const runFunction = extractRunFunction(property);
		if (runFunction) {
			return runFunction;
		}
	}

	return null;
}

/**
 * Extract run function from object property
 */
function extractRunFunction(property: ts.ObjectLiteralElement): RunFunctionType | null {
	// Skip if property name is not 'run'
	if (!property.name || !ts.isIdentifier(property.name) || property.name.text !== 'run') {
		return null;
	}

	// Handle method shorthand: run(options) {}
	if (ts.isMethodDeclaration(property)) {
		return property;
	}

	// Handle property assignment: run: function(options) {} or run: (options) => {}
	if (ts.isPropertyAssignment(property)) {
		const { initializer } = property;
		if (ts.isFunctionExpression(initializer) || ts.isArrowFunction(initializer)) {
			return initializer;
		}
	}

	return null;
}

/**
 * Extract parameter information from a function parameter
 * @param param - Parameter declaration to extract information from
 * @param checker - TypeScript type checker
 * @returns Parameter information or null
 */
function extractParameterInfo(param: ts.ParameterDeclaration, checker: ts.TypeChecker): ExtractedParameter | null {
	if (!param.name || !ts.isIdentifier(param.name)) {
		return null;
	}

	const paramName = param.name.text;
	const type = checker.getTypeAtLocation(param);

	// Simplify CommandLineOptions type display
	let typeString = checker.typeToString(type);
	if (typeString.startsWith('CommandLineOptions<')) {
		typeString = 'CommandLineOptions';
	}

	return {
		name: paramName,
		type: typeString,
		optional: !!param.questionToken,
		description: `${paramName} parameter`, // Default description
	};
}
