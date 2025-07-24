import * as ts from 'typescript';

/**
 * Resolves aliased symbols (imports) to their actual definitions
 */
export function resolveSymbol(symbol: ts.Symbol | undefined, checker: ts.TypeChecker): ts.Symbol | null {
	if (!symbol) {
		return null;
	}

	// Bitwise check for alias flag is intentional here - using comparison to satisfy eslint
	// eslint-disable-next-line no-bitwise
	return (symbol.flags & ts.SymbolFlags.Alias) > 0 ? checker.getAliasedSymbol(symbol) : symbol;
}

function getVariableDeclarationFromSymbol(symbol: ts.Symbol | null): ts.VariableDeclaration | null {
	if (!symbol?.valueDeclaration) {
		return null;
	}

	const declaration = symbol.valueDeclaration;
	return ts.isVariableDeclaration(declaration) ? declaration : null;
}

function unwrapExpression(initializer: ts.Expression): ts.Expression {
	return ts.isAsExpression(initializer) ? initializer.expression : initializer;
}

export function getArrayElementsFromSymbol(symbol: ts.Symbol | null): ts.Expression[] | null {
	const declaration = getVariableDeclarationFromSymbol(symbol);
	if (!declaration?.initializer) {
		return null;
	}

	const unwrapped = unwrapExpression(declaration.initializer);
	if (ts.isArrayLiteralExpression(unwrapped)) {
		return Array.from(unwrapped.elements);
	}

	return null;
}

export function getObjectLiteralFromSymbol(symbol: ts.Symbol | null): ts.ObjectLiteralExpression | null {
	const declaration = getVariableDeclarationFromSymbol(symbol);
	if (!declaration?.initializer) {
		return null;
	}

	const unwrapped = unwrapExpression(declaration.initializer);
	return ts.isObjectLiteralExpression(unwrapped) ? unwrapped : null;
}

/**
 * Convert JSDoc @see link references to documentation paths with relative linking support
 *
 * Supports external URLs and relative paths in JSDoc @see tags: like 'https://example.com', 'applet/', '../upload/'
 *
 * @param linkReference - Link reference from JSDoc @see tag
 * @param currentPath - Current command path for relative linking (e.g., 'applet/upload/index')
 * @returns Processed link or relative path
 */
export function convertLinkToPath(linkReference: string, currentPath: string = ''): string {
	// External URLs - return as-is
	if (linkReference.startsWith('http://') || linkReference.startsWith('https://')) {
		return linkReference;
	}

	// Relative paths - calculate relative path if currentPath is provided
	if (linkReference.includes('/')) {
		return getRelativePath(linkReference, currentPath);
	}

	// Single word references (should not happen with current JSDoc patterns, but handle gracefully)
	return linkReference;
}

/**
 * Calculate relative path based on current document location
 * @param targetPath - Target markdown file path
 * @param currentPath - Current document location (e.g., 'applet/upload/index')
 * @returns Relative path to target
 */
function getRelativePath(targetPath: string, currentPath: string): string {
	// If no current path, return as-is
	if (!currentPath) {
		return targetPath;
	}

	// If the targetPath is already a relative path (starts with ./ or ../),
	// return it as-is since it's already relative to the command structure
	if (targetPath.startsWith('./') || targetPath.startsWith('../')) {
		return targetPath;
	}

	// Remove '/index' suffix if present to get the actual directory path
	const cleanCurrentPath = currentPath.replace(/\/index$/, '');

	// Calculate relative path based on current depth for absolute paths
	const currentDepth = cleanCurrentPath.split('/').length;
	if (currentDepth > 0) {
		const upLevels = '../'.repeat(currentDepth);
		return `${upLevels}${targetPath}`;
	}

	return targetPath;
}
