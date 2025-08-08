import { promises as fs, existsSync, statSync } from 'fs';
import * as path from 'path';
import type { LinkValidationResult } from '../core/domain-types.js';
import { LINK_VALIDATION } from '../process/utils/constants.js';
import { DOCS_CONFIG } from '../config.js';

export const logger = {
	info: (message: string) => console.info(message),
	success: (message: string) => console.info(`✅ ${message}`),
	warn: (message: string) => console.warn(`⚠️  ${message}`),
	error: (message: string) => console.error(`❌ ${message}`),
	debug: (message: string, data?: unknown) => {
		console.info(`🐛 Debug: ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`);
	},
};

export async function findMarkdownFiles(dir: string): Promise<string[]> {
	if (!existsSync(dir)) {
		return [];
	}

	const entries = await fs.readdir(dir, { withFileTypes: true });
	const results: string[] = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			results.push(...(await findMarkdownFiles(fullPath)));
		} else if (entry.name.endsWith('.md')) {
			results.push(fullPath);
		}
	}

	return results;
}

export function extractLinks(content: string): string[] {
	const linkPatterns = [
		/\[([^\]]+)\]\(([^)]+)\)/g, // [text](link)
		/^\s*\[([^\]]+)\]:\s*(.+)$/gm, // [text]: link
	];

	return [
		...new Set(
			linkPatterns.flatMap((pattern) =>
				[...content.matchAll(pattern)].map((match) => match[2]?.trim()).filter((link): link is string => Boolean(link)),
			),
		),
	];
}

export async function ensureDir(dirPath: string): Promise<void> {
	await fs.mkdir(dirPath, { recursive: true });
}

export async function readFileSafe(filePath: string): Promise<string> {
	try {
		return await fs.readFile(filePath, 'utf-8');
	} catch (error: unknown) {
		// Static template files are optional, so we don't log debug messages for ENOENT errors
		const nodeError = error as NodeJS.ErrnoException;
		if (nodeError?.code !== 'ENOENT') {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			logger.debug(`Failed to read file ${filePath}: ${errorMessage}`);
		}
		return '';
	}
}

export async function checkExternalLink(url: string): Promise<boolean> {
	try {
		const response = await fetch(url, {
			method: 'HEAD',
			signal: AbortSignal.timeout(LINK_VALIDATION.EXTERNAL_TIMEOUT_MS),
		});
		return response.ok;
	} catch {
		return false;
	}
}

/**
 * Validates links using URL API, handles both internal and external links
 */
export function validateLink(link: string, currentFile: string): LinkValidationResult {
	try {
		// Try to parse as absolute URL first
		const url = new URL(link);
		return { type: 'external', resolved: url.href };
	} catch {
		// Not an absolute URL, treat as relative/internal
		try {
			let resolvedPath: string;

			// Handle CLI documentation absolute paths (e.g., /cli/applet/)
			if (link.startsWith(DOCS_CONFIG.paths.cliDocsBasePath)) {
				// Convert CLI paths to local docs paths
				const cliPath = link.replace(DOCS_CONFIG.paths.cliDocsBasePath, '');
				const docsDir = path.resolve('./docs');
				resolvedPath = path.join(docsDir, cliPath);

				// If it ends with /, check for index.md
				if (cliPath.endsWith('/')) {
					const indexPath = path.join(resolvedPath, 'index.md');
					const dirExists = existsSync(resolvedPath) && statSync(resolvedPath).isDirectory();
					const indexExists = existsSync(indexPath);

					return {
						type: 'internal',
						resolved: indexPath,
						exists: dirExists && indexExists,
					};
				} else {
					return {
						type: 'internal',
						resolved: resolvedPath,
						exists: existsSync(resolvedPath),
					};
				}
			}

			// Handle regular relative paths
			const baseUrl = `file://${currentFile}`;
			const resolvedUrl = new URL(link, baseUrl);
			const pathname = resolvedUrl.pathname;

			if (!pathname) {
				return { type: 'invalid', resolved: link };
			}

			resolvedPath = (pathname || '').split('#')[0]; // Remove anchor

			if (!resolvedPath) {
				return { type: 'invalid', resolved: link };
			}

			return {
				type: 'internal',
				resolved: resolvedPath,
				exists: existsSync(resolvedPath),
			};
		} catch {
			return { type: 'invalid', resolved: link };
		}
	}
}

/**
 * Extracts text from TypeScript JSDoc comment structures, handling both string and NodeArray formats
 */
export function extractCommentText(
	comment: string | import('typescript').NodeArray<import('typescript').JSDocComment> | undefined,
): string {
	if (!comment) {
		return '';
	}

	if (typeof comment === 'string') {
		return comment;
	}

	// Handle JSDocText nodes (checking if it's iterable)
	if (comment && typeof comment[Symbol.iterator] === 'function') {
		return Array.from(comment).map(extractSingleCommentPart).join('');
	}

	return '';
}

/**
 * Extract text from a single comment part
 * @param part - Comment part to extract
 * @returns Extracted text
 */
function extractSingleCommentPart(part: any): string {
	if (typeof part === 'string') {
		return part;
	}

	if ('text' in part && typeof part.text === 'string') {
		return part.text;
	}

	// Handle JSDoc links - with improved URL reconstruction
	if ('name' in part && 'text' in part) {
		return reconstructUrlFromParts(part.name, part.text);
	}

	return '';
}

/**
 * Reconstruct URL from name and text parts from JSDoc link nodes
 * @param namePart - Name part of the JSDoc link (contains URL)
 * @param textPart - Text part of the JSDoc link (contains description)
 * @returns Reconstructed text in format "url description"
 */
function reconstructUrlFromParts(namePart: any, textPart: any): string {
	const name = namePart && 'getText' in namePart && typeof namePart.getText === 'function' ? (namePart.getText() ?? '') : '';
	const text = typeof textPart === 'string' ? textPart : '';

	// Simply combine the name and text parts
	// The processSeeTag function will handle the URL reconstruction
	return name + text;
}
