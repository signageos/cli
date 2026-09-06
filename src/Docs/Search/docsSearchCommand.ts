import { z } from 'zod';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';

const querySchema = z.string().trim().min(1).max(500);
const limitSchema = z.number().int().min(1).max(10);
const responseSchema = z.object({
	query: z.string(),
	results: z.array(
		z
			.object({
				url: z.string().url(),
				text: z.string(),
				title: z.string().optional(),
				score: z.number().optional(),
			})
			.passthrough(),
	),
});
const errorSchema = z.object({ error: z.object({ message: z.string() }) });

export const QUERY_OPTION = { name: 'query', type: String, description: 'What to look up, in plain words' } as const;
export const LIMIT_OPTION = { name: 'limit', type: Number, description: 'Number of results, 1-10 (default 5)' } as const;
const OPTION_LIST = [QUERY_OPTION, LIMIT_OPTION] as const;

/** SOS_DOCS_URL overrides the packaged default (SOS_DEFAULT_DOCS_URL from .env.production). */
export function getDocsUrl(): string {
	const url = process.env.SOS_DOCS_URL || process.env.SOS_DEFAULT_DOCS_URL;
	if (!url) {
		throw new Error('No docs search URL is configured. Set SOS_DOCS_URL.');
	}
	return url.replace(/\/+$/, '');
}

/**
 * Searches the public signageOS documentation (docs.signageos.io) by meaning, not just
 * keywords, and prints the matching passages with their page URLs as JSON. Meant for
 * AI agents and scripts that need an authoritative answer before acting; no login required.
 * Uses https://docs-search.signageos.io by default. Set SOS_DOCS_URL to override the search endpoint.
 *
 * @group Tools:303
 *
 * @example
 * ```bash
 * sos docs search --query "how do I assign an applet to a device with configuration"
 * sos docs search --query "BrightSign native debug" --limit 3
 * ```
 *
 * @throws {Error} When --query is missing
 *
 * @since 4.5.0
 */
export const docsSearch = createCommandDefinition({
	name: 'search',
	description: 'Search the public signageOS documentation and print matching passages as JSON',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		if (!options.query) {
			throw new Error('Missing argument --query <text>');
		}
		const query = querySchema.parse(options.query);
		const limit = limitSchema.parse(options.limit === undefined ? 5 : options.limit);
		const url = new URL(getDocsUrl() + '/search');
		url.searchParams.set('q', query);
		url.searchParams.set('limit', String(limit));
		const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
		const body = await response.text();
		if (!response.ok) {
			let detail = body;
			try {
				const error = errorSchema.safeParse(JSON.parse(body));
				if (error.success) {
					detail = error.data.error.message;
				}
			} catch {
				detail = body;
			}
			process.stderr.write(`HTTP ${response.status} ${response.statusText}: ${detail}\n`);
			process.exitCode = 1;
			return;
		}
		const result = responseSchema.parse(JSON.parse(body));
		process.stdout.write(JSON.stringify(result.results) + '\n');
	},
});
