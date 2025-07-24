import * as ts from 'typescript';

/**
 * Check if a node is a createCommandDefinition call
 */
export function isCreateCommandDefinitionCall(node: ts.Node): node is ts.CallExpression {
	return ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'createCommandDefinition';
}

export function isVariableWithName(node: ts.Node, name: string): node is ts.VariableStatement {
	return (
		ts.isVariableStatement(node) &&
		node.declarationList.declarations.some((decl) => ts.isIdentifier(decl.name) && (decl.name.text === name || decl.name.text === 'index'))
	);
}

export function isExportAssignmentWithName(node: ts.Node, name: string): node is ts.ExportAssignment {
	if (!ts.isExportAssignment(node) || !node.expression) {
		return false;
	}
	const exportName = getExportName(node.expression);
	return exportName === name || exportName === 'index';
}

export function getExportName(expression: ts.Expression): string {
	if (ts.isIdentifier(expression)) {
		return expression.text;
	}
	return '';
}

export function getCommandDefinitionObject(callExpression: ts.Node): ts.ObjectLiteralExpression | null {
	if (!isCreateCommandDefinitionCall(callExpression)) {
		return null;
	}

	const firstArg = callExpression.arguments[0];
	return firstArg && ts.isObjectLiteralExpression(firstArg) ? firstArg : null;
}

export function getObjectProperties(objectLiteral: ts.ObjectLiteralExpression): Map<string, ts.PropertyAssignment> {
	const properties = new Map<string, ts.PropertyAssignment>();

	for (const property of objectLiteral.properties) {
		if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
			properties.set(property.name.text, property);
		}
	}

	return properties;
}
