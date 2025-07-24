import * as fs from 'fs/promises';
import * as path from 'path';
import * as ts from 'typescript';
import { cliRouter } from './router/cliRouter.js';
import { cliCommandTemplate } from './templates/cliCommandTemplate.js';
import { buildStaticTemplatePath } from './process/utils/constants.js';
import { logger, readFileSafe, ensureDir } from './utils/shared.js';
import type { CliCommand } from './core/domain-types.js';

(async () => {
	// remove the existing docs directory if it exists
	await fs.rm('docs', { recursive: true, force: true });

	const program = ts.createProgram({
		rootNames: (await fs.readdir('./src', { recursive: true }))
			.filter((file) => file.endsWith('.ts'))
			.map((file) => path.resolve('./src', file)),
		options: {},
	});

	// ts.TypeChecker analyzes all source files and creates symbols and types
	const checker = program.getTypeChecker();

	logger.info('Generating CLI documentation...');

	async function generateCommandDocs(pathname: string, command: CliCommand): Promise<void> {
		const outputPath = `./docs/${pathname}.md`;

		// Read additional static documentation
		const staticPath = buildStaticTemplatePath(pathname);
		const additionalDocs = await readFileSafe(staticPath);

		// Generate the markdown content with pathname for relative link calculation
		const markdownContent = await cliCommandTemplate(command, additionalDocs, pathname, command.accumulatedPosition || 0);

		// Write the documentation file (directory already exists)
		await fs.writeFile(outputPath, markdownContent);
	}

	try {
		const pages = [...cliRouter(program, checker)];

		logger.info(`Found ${pages.length} commands to document`);

		// Pre-create all necessary directories
		const directories = new Set(pages.map(([pathname]) => path.dirname(`./docs/${pathname}.md`)));
		await Promise.all([...directories].map((dir) => ensureDir(dir)));

		// Generate documentation for all commands
		const promises = pages.map(([pathname, command]) => generateCommandDocs(pathname, command));

		await Promise.all(promises);
		logger.success('CLI documentation generated successfully!');
	} catch (error) {
		logger.error('Error generating CLI documentation:');
		logger.error(error instanceof Error ? error.stack || error.message : String(error));
		process.exit(1);
	}
})().catch((error) => {
	logger.error('Unexpected error:');
	logger.error(error instanceof Error ? error.stack || error.message : String(error));
	process.exit(1);
});
