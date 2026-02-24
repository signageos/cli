/**
 * Validate documentation links
 * Usage: node tools/docs/validate/validate-docs-links.ts
 */

import { logger, findMarkdownFiles, extractLinks, readFileSafe, checkExternalLink, validateLink } from '../utils/shared.js';
import type { LinkCounts } from '../core/domain-types.js';
import { existsSync } from 'fs';
import * as path from 'path';

interface ProcessFileResult {
	errors: string[];
	linkCounts: LinkCounts;
}

/**
 * Process a single file's links
 */
async function processFileLinks(filePath: string, docsDir: string): Promise<ProcessFileResult> {
	// Normalize paths to use forward slashes for cross-platform compatibility
	const normalizedFilePath = filePath.replace(/\\/g, '/');
	const normalizedDocsDir = docsDir.replace(/\\/g, '/');
	const relativePath = normalizedFilePath.replace(normalizedDocsDir, '').replace(/^\//, '');
	const content = await readFileSafe(filePath);

	if (!content) {
		return { errors: [`Failed to read file: ${relativePath}`], linkCounts: { internal: 0, external: 0 } };
	}

	const links = extractLinks(content);

	const results: ProcessFileResult = {
		errors: [],
		linkCounts: { internal: 0, external: 0 },
	};

	for (const link of links) {
		const validation = validateLink(link, filePath);

		if (validation.type === 'external') {
			results.linkCounts.external++;
			const isAccessible = await checkExternalLink(validation.resolved);
			if (!isAccessible) {
				results.errors.push(`${relativePath}: external link not accessible "${link}"`);
			}
		} else if (validation.type === 'internal') {
			results.linkCounts.internal++;
			if (!validation.exists) {
				results.errors.push(`${relativePath}: broken internal link "${link}"`);
			}
		} else {
			results.errors.push(`${relativePath}: invalid link "${link}"`);
		}
	}

	return results;
}

async function validateDocsLinks(): Promise<void> {
	logger.info('Validating documentation links...\n');

	// Simple path resolution - docs directory is always at project root
	const docsDir = path.resolve('./docs');

	if (!existsSync(docsDir)) {
		logger.error(`Documentation directory not found: ${docsDir}`);
		process.exit(1);
	}

	const files = await findMarkdownFiles(docsDir);

	logger.info(`Found ${files.length} markdown files\n`);
	logger.info('Checking links...');

	const allResults = await Promise.all(files.map((filePath) => processFileLinks(filePath, docsDir)));

	const errors = allResults.flatMap((result) => result.errors);
	const linkCounts: LinkCounts = allResults.reduce(
		(acc: LinkCounts, result: ProcessFileResult) => ({
			internal: acc.internal + result.linkCounts.internal,
			external: acc.external + result.linkCounts.external,
		}),
		{ internal: 0, external: 0 },
	);

	if (errors.length > 0) {
		logger.error('Found broken links:');
		errors.forEach((error) => logger.error(`  ${error}`));
		process.exit(1);
	} else {
		logger.success(`All links are valid! (internal: ${linkCounts.internal}, external: ${linkCounts.external})`);
	}
}

// Run validation
validateDocsLinks().catch((error: unknown) => {
	const errorMessage = error instanceof Error ? error.message : 'Unknown error';
	logger.error(`Validation failed: ${errorMessage}`);
	process.exit(1);
});
