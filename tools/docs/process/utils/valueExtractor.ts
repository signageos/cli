import * as ts from 'typescript';

export function getPropertyValue(node: ts.Node): string {
	// String literals
	if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
		return node.text;
	}

	// Template expressions
	if (ts.isTemplateExpression(node)) {
		return extractTemplateValue(node);
	}

	// Numbers
	if (ts.isNumericLiteral(node)) {
		return node.text;
	}

	// String concatenation
	if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
		return handleStringConcatenation(node);
	}

	// Boolean literals
	if (node.kind === ts.SyntaxKind.TrueKeyword) {
		return 'true';
	}
	if (node.kind === ts.SyntaxKind.FalseKeyword) {
		return 'false';
	}

	// Identifiers (including type constructors)
	if (ts.isIdentifier(node)) {
		return handleIdentifierValue(node);
	}

	return '';
}

function extractTemplateValue(node: ts.TemplateExpression): string {
	let result = node.head.text;

	for (const templateSpan of node.templateSpans) {
		result += formatTemplateExpression(templateSpan.expression);
		result += templateSpan.literal.text;
	}

	return result;
}

/**
 * Formats template expressions for readable output (e.g., [expression])
 */
function formatTemplateExpression(expression: ts.Expression): string {
	if (ts.isPropertyAccessExpression(expression)) {
		return `[${expression.getText()}]`;
	}
	if (ts.isCallExpression(expression)) {
		return `[${expression.expression.getText()}()]`;
	}
	return `[expression]`;
}

function handleStringConcatenation(node: ts.BinaryExpression): string {
	const left = getPropertyValue(node.left);
	const right = getPropertyValue(node.right);

	// Add space if both parts exist and don't already have appropriate spacing
	if (left && right && !left.endsWith(' ') && !right.startsWith(' ')) {
		return left + ' ' + right;
	}
	return left + right;
}

/**
 * Converts TypeScript constructor types (String, Number, Boolean) to primitives
 */
function handleIdentifierValue(node: ts.Identifier): string {
	// Convert TypeScript constructor types to lowercase primitive types
	const typeMap: Record<string, string> = {
		String: 'string',
		Number: 'number',
		Boolean: 'boolean',
	};

	return typeMap[node.text] || node.text;
}

export function parseObjectLiteral(objectLiteral: ts.ObjectLiteralExpression): Record<string, string> {
	const result: Record<string, string> = {};

	for (const prop of objectLiteral.properties) {
		if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
			result[prop.name.text] = getPropertyValue(prop.initializer);
		}
	}

	return result;
}
