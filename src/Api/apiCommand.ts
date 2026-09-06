import { CommandLineOptions, createCommandDefinition } from '../Command/commandDefinition';
import { NO_DEFAULT_ORGANIZATION_OPTION, ORGANIZATION_UID_OPTION } from '../Organization/organizationFacade';
import { loadConfig } from '../RunControl/runControlHelper';
import { API_METHODS, callApi, isApiMethod } from './apiRequest';

export const METHOD_OPTION = {
	name: 'method',
	type: String,
	description: 'HTTP method: GET (default), POST, PUT or DELETE',
} as const;
export const PATH_OPTION = {
	name: 'path',
	type: String,
	description: 'API path relative to the API URL, query string allowed, e.g. /v2/device?limit=10',
} as const;
export const DATA_OPTION = {
	name: 'data',
	type: String,
	description: 'JSON request body, inline or @path/to/file.json',
} as const;

export const CONFIRM_WRITE_OPTION = {
	name: 'confirm-write',
	type: Boolean,
	description: 'Explicitly allow this POST, PUT or DELETE request; it may change or permanently delete data',
} as const;

const OPTION_LIST = [
	METHOD_OPTION,
	PATH_OPTION,
	DATA_OPTION,
	CONFIRM_WRITE_OPTION,
	ORGANIZATION_UID_OPTION,
	NO_DEFAULT_ORGANIZATION_OPTION,
] as const;

/**
 * Calls any signageOS REST API endpoint with the credentials stored by `sos login`
 * and prints the raw response body to stdout. Built for scripts and AI agents that
 * need endpoints the CLI has no dedicated command for: device search, telemetry,
 * screenshots, debug settings, timings.
 *
 * The path is always relative to the API URL, so it cannot change the host. `--api-url`
 * and `SOS_API_URL` do change it, and the stored token is sent there. With an Auth0 login the default organization (or
 * `--organization-uid`) is appended as the `organizationUid` query parameter; with
 * legacy organization credentials it is omitted because the credentials already carry it.
 *
 * GET is the default; POST, PUT and DELETE require --confirm-write per invocation.
 * Review the target and body first: writes can permanently change data. The flag
 * records opt-in, not proof of human approval; server permissions still apply.
 *
 * Diagnostics go to stderr; stdout holds nothing but the response body. A non-2xx
 * status is printed to stderr as `HTTP <status> <text>` and the exit code is 1.
 *
 * @group Tools:301
 *
 * @example
 * ```bash
 * # Search devices in the default organization
 * sos api --path "/v2/device?search=lobby&limit=20"
 *
 * # Latest telemetry of one device
 * sos api --path /v1/device/<deviceUid>/telemetry/latest
 *
 * # Ask a device for a fresh screenshot
 * sos api --method POST --confirm-write --path /v1/device/<deviceUid>/screenshot
 *
 * # Create a timing from a JSON file (safest quoting on Windows)
 * sos api --method POST --confirm-write --path /v1/timing --data @timing.json
 *
 * # Account-level endpoint, no organization scope
 * sos api --path /v1/organization --no-default-organization
 * ```
 *
 * @throws {Error} When not logged in
 * @throws {Error} When --path is missing, does not start with "/", or --data is not valid JSON
 * @throws {Error} When --data is used with GET
 *
 * @see {@link https://developers.signageos.io/api/ REST API reference}
 *
 * @since 4.5.0
 */
export const api = createCommandDefinition({
	name: 'api',
	description: 'Call the signageOS REST API with the stored credentials and print the raw response',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const method = (options.method ?? 'GET').toUpperCase();
		if (!isApiMethod(method)) {
			throw new Error(`--method must be one of ${API_METHODS.join(', ')}`);
		}
		if (!options.path) {
			throw new Error('Missing argument --path </v1/...>');
		}
		if (method === 'GET' && options.data !== undefined) {
			throw new Error('--data cannot be used with GET; pass --method POST, PUT or DELETE');
		}
		if (method !== 'GET' && !options['confirm-write']) {
			throw new Error(
				`${method} may change or permanently delete data. Review the target and body, then pass --confirm-write to allow this request.`,
			);
		}
		const config = await loadConfig();
		const organizationUid = options['organization-uid'] ?? (options['no-default-organization'] ? undefined : config.defaultOrganizationUid);
		if (method !== 'GET') {
			process.stderr.write(`Confirmed ${method} request; server permissions still apply.\n`);
		}
		const response = await callApi({ method, path: options.path, data: options.data, organizationUid });
		if (response.body) {
			process.stdout.write(response.body.endsWith('\n') ? response.body : response.body + '\n');
		}
		if (response.status < 200 || response.status >= 300) {
			process.stderr.write(`HTTP ${response.status} ${response.statusText}\n`);
			process.exitCode = 1;
		}
	},
});
