import {
	generateTitle,
	generateDescription,
	generateUsage,
	generateOptionsTable,
	generateParameters,
	generateSubcommands,
	generateExamples,
	generateRemarks,
	/* Throws implemented, but disabled for now
	 * generateThrows,
	 */
	generateMetadata,
	generateGlobalOptions,
	generateRelatedCommands,
	generateSeeAlso,
	stack,
} from './sections.js';
import type { CliCommand } from '../core/domain-types.js';
import { DOCS_CONFIG } from '../config.js';

/**
 * Generates Docusaurus frontmatter with ordering and titles
 */
function generateFrontmatter(command: CliCommand, pathname: string, accumulatedPosition: number = 0): string {
	const { name } = command;

	// Generate ID from pathname
	const id = pathname === 'index' ? DOCS_CONFIG.commands.rootCommandName : pathname.replace(/\//g, '-');

	// Generate title
	let title: string = DOCS_CONFIG.commands.rootCommandTitle;
	if (name !== DOCS_CONFIG.commands.rootCommandName) {
		// Use only the command name for title (not the full path)
		title = name;
	}

	// Calculate sidebar position by accumulating priorities from root to current command
	let sidebarPosition: number;
	if (pathname === 'index') {
		sidebarPosition = 0;
	} else {
		// Use the pre-calculated accumulated position from the router
		sidebarPosition = accumulatedPosition;
	}

	// prettier-ignore
	const frontmatter = [
		'---',
		`id: ${id}`,
		`title: ${title}`,
		`sidebar_position: ${sidebarPosition}`,
		'---', ''].join('\n');

	return frontmatter;
}

/**
 * Generates complete CLI command documentation with frontmatter and content sections
 */
export async function cliCommandTemplate(
	command: CliCommand,
	examples: string = '',
	pathname: string = '',
	accumulatedPosition: number = 0,
): Promise<string> {
	// Generate frontmatter for Docusaurus
	const frontmatter = generateFrontmatter(command, pathname, accumulatedPosition);

	// Generate all sections and stack them with proper spacing
	const content = stack(
		generateTitle(command),
		await generateDescription(command),
		generateRemarks(command.jsDoc),
		generateUsage(command),
		generateParameters(command),
		generateOptionsTable(command.options),
		generateSubcommands(command),
		generateExamples(command, examples),
		// generateThrows(command.jsDoc), // Skipping throws generation for now
		generateMetadata(command.jsDoc),
		await generateGlobalOptions(command.name),
		generateRelatedCommands(command),
		await generateSeeAlso(command.jsDoc, pathname),
	);

	// Combine frontmatter with content
	return frontmatter + content;
}
