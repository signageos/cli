import * as ts from 'typescript';
import { DOCS_CONFIG } from '../../config.js';

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
 * Convert a target path to an absolute CLI docs path
 * @param targetPath - Target path to convert
 * @returns Absolute CLI docs path
 */
function toAbsoluteCliDocsPath(targetPath: string): string {
	return `${DOCS_CONFIG.paths.cliDocsBasePath}${targetPath}`;
}

/**
 * Check if a path should be treated as an absolute CLI command path
 * @param targetPath - Path to check
 * @returns True if path should be made absolute
 */
function isAbsolutePath(targetPath: string): boolean {
	return targetPath.endsWith('/') && !targetPath.startsWith('./') && !targetPath.startsWith('../');
}

/**
 * Check if a path is already a relative path
 * @param targetPath - Path to check
 * @returns True if path starts with ./ or ../
 */
function isRelativePath(targetPath: string): boolean {
	return targetPath.startsWith('./') || targetPath.startsWith('../');
}

/**
 * Check if a path is a plain path (no special prefixes or suffixes)
 * @param targetPath - Path to check
 * @returns True if path is neither absolute CLI path nor relative path
 */
function isPlainPath(targetPath: string): boolean {
	return !isAbsolutePath(targetPath) && !isRelativePath(targetPath);
}

/**
 * Build a relative path string based on directory depth
 * @param targetPath - Target path to link to
 * @param currentPath - Current document path
 * @returns Relative path string
 */
function buildRelativePath(targetPath: string, currentPath: string): string {
	// Remove '/index' suffix to get the actual directory path
	const currentDirectoryPath = currentPath.replace(/\/index$/, '');

	// Calculate how many levels up we need to go
	const directoryDepth = currentDirectoryPath.split('/').length;
	if (directoryDepth > 0) {
		const upDirectoryLevels = '../'.repeat(directoryDepth);
		return `${upDirectoryLevels}${targetPath}`;
	}

	return targetPath;
}

/**
 * Calculate relative path based on current document location
 * @param targetPath - Target markdown file path
 * @param currentPath - Current document location (e.g., 'applet/upload/index')
 * @returns Absolute or relative path to target
 */
function getRelativePath(targetPath: string, currentPath: string): string {
	// Handle paths that should be made absolute (nested CLI command paths)
	if (isAbsolutePath(targetPath)) {
		return toAbsoluteCliDocsPath(targetPath);
	}

	// Keep existing relative paths as-is
	if (isRelativePath(targetPath)) {
		return targetPath;
	}

	// Handle plain paths (files, simple directory names without special prefixes/suffixes)
	if (isPlainPath(targetPath)) {
		// If no current path context, return target path as-is
		if (!currentPath) {
			return targetPath;
		}

		// Build relative path based on current document location
		return buildRelativePath(targetPath, currentPath);
	}

	// Fallback for any unhandled cases
	return targetPath;
}
