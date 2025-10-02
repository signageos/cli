/**
 * Documentation generator configuration
 */

export const DOCS_CONFIG = {
	/**
	 * File and directory paths
	 */
	paths: {
		/** Source code directory to scan for commands */
		sourceDir: './src',
		/** Output directory for generated documentation */
		outputDir: './docs',
		/** Directory containing static template files */
		staticTemplatesDir: 'tools/docs/templates/static',
		/** Main entry file name to look for */
		indexFileName: 'index.ts',
		/** Base path for internal CLI documentation links (e.g., '/cli/') */
		cliDocsBasePath: '/cli/',
	},

	/**
	 * Command categorization and naming
	 */
	commands: {
		/** Root command name */
		rootCommandName: 'sos',
		/** Title for the root command documentation page */
		rootCommandTitle: 'Introduction',
		/** JSDoc group marker for private commands to exclude from docs */
		privateGroupMarker: 'Private',
		/** Order of command categories in documentation */
		categoryOrder: ['Authentication', 'Development', 'Management', 'Tools'],
	},

	/**
	 * Sidebar positioning configuration
	 */
	sidebar: {
		/** Multipliers for calculating sidebar positions based on hierarchy level */
		multipliers: {
			/** Root level commands: priority × 100 */
			root: 100,
			/** First level subcommands: priority × 10 */
			firstLevel: 10,
			/** Second level and deeper: priority × 1 */
			secondLevelAndUp: 1,
		},
	},

	/**
	 * Link validation settings
	 */
	validation: {
		/** Timeout in milliseconds for external link validation */
		externalLinkTimeoutMs: 5000,
	},

	/**
	 * Static template files
	 */
	templates: {
		staticFiles: {
			/** Overview content for the main documentation page */
			overview: 'index.md',
			/** Global options section content */
			globalOptions: 'global-options.md',
		},
	},

	/**
	 * Formatting and content generation settings
	 */
	formatting: {
		/** Section header text for different documentation sections */
		sectionHeaders: {
			usage: '## Usage',
			options: '## Options',
			commands: '## Commands',
			subcommands: '## Subcommands',
		},
		/** Code block language for usage examples */
		codeBlockLanguage: 'bash',
		/** File extensions used in the project */
		fileExtensions: {
			typescript: '.ts',
			markdown: '.md',
		},
	},
} as const;

/**
 * Type for the configuration object
 */
export type DocsConfig = typeof DOCS_CONFIG;
