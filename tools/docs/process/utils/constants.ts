import * as path from 'path';
import { readFile } from 'fs/promises';
import { logger } from '../../utils/shared.js';
import { DOCS_CONFIG } from '../../config.js';

export function getStaticTemplatesPath(): string {
	return path.join(process.cwd(), DOCS_CONFIG.paths.staticTemplatesDir);
}

export async function readStaticTemplate(templateName: string): Promise<string> {
	const templatePath = path.join(getStaticTemplatesPath(), templateName);
	try {
		return await readFile(templatePath, 'utf8');
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		logger.warn(`Failed to read template ${templateName}: ${message}`);
		return '';
	}
}

/**
 * Builds template paths for commands (e.g., 'login/index' -> 'login/login.md')
 */
export function buildStaticTemplatePath(pathname: string): string {
	const basePath = getStaticTemplatesPath();

	if (pathname.includes('/')) {
		return path.join(basePath, `${pathname}.md`);
	} else {
		return path.join(basePath, pathname, `${pathname}.md`);
	}
}

/**
 * Link validation configuration
 */
export const LINK_VALIDATION = {
	EXTERNAL_TIMEOUT_MS: DOCS_CONFIG.validation.externalLinkTimeoutMs,
} as const;
