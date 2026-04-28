import { stringify } from 'querystring';
import prompts from 'prompts';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import IRestApiOptions from '@signageos/sdk/dist/RestApi/IOptions';
import { loadConfig, IExtendedConfig } from './RunControl/runControlHelper';
import { ApiVersions } from '@signageos/sdk/dist/RestApi/apiVersions';
import { parameters } from './parameters';
import { getGlobalApiUrl } from './Command/globalArgs';

type RequestInit = globalThis.RequestInit;
interface ICredentials {
	oauthClientId: string;
	oauthClientSecret: string;
}

export async function loadApiUrl() {
	const config = await loadConfig();
	return getApiUrl(config);
}

export function getApiUrl(config: IExtendedConfig) {
	// Precedence:
	// 1. Explicit global CLI argument (--api-url)
	// 2. Environment variable (SOS_API_URL) - for CI/CD and testing
	// 3. Stored profile configuration (config.apiUrl from ~/.sosrc)
	const cliUrl = getGlobalApiUrl();
	const profileUrl = config.apiUrl;
	const rawApiUrl = cliUrl || profileUrl;
	if (!rawApiUrl) {
		throw new Error(`No API URL is defined. Please use --api-url or set SOS_API_URL environment variable.`);
	}
	// Normalize: remove trailing slashes to avoid double '//'
	return rawApiUrl.replace(/\/+$/, '');
}

export function createClientVersions() {
	return {
		['signageOS_CLI']: parameters.version,
	};
}

export async function createOrganizationRestApi(credentials: ICredentials) {
	const config = await loadConfig();
	const auth = config.accessToken
		? { accessToken: config.accessToken }
		: { clientId: credentials.oauthClientId, secret: credentials.oauthClientSecret };
	const options: IRestApiOptions = {
		url: await loadApiUrl(),
		auth,
		version: ApiVersions.V1,
		clientVersions: createClientVersions(),
	};
	const accountOptions: IRestApiOptions = {
		...options,
	};

	return new RestApi(options, accountOptions);
}

export const AUTH_HEADER = 'X-Auth';

export interface IOptions {
	url: string;
	auth: {
		clientId: string | undefined;
		secret: string | undefined;
	};
	/** JWT access token — when set, used as `X-Auth: <token>` (takes precedence over clientId:secret) */
	accessToken?: string;
	version: ApiVersions;
	headers?: { [name: string]: string };
}

export function createOptions(method: 'POST' | 'GET' | 'PUT' | 'DELETE', options: IOptions, data?: any): RequestInit {
	// Prefer JWT accessToken when available; fall back to legacy clientId:secret
	const authValue = options.accessToken ? options.accessToken : (options.auth.clientId ?? '') + ':' + (options.auth.secret ?? '');
	return {
		headers: {
			'Content-Type': 'application/json',
			[AUTH_HEADER]: authValue,
			...(options.headers || {}),
		},
		method,
		body: typeof data !== 'undefined' ? JSON.stringify(data) : undefined,
	};
}

export function createUri(options: IOptions, resource: string, queryParams?: any) {
	return [options.url, options.version, resource].join('/') + (typeof queryParams !== 'undefined' ? '?' + stringify(queryParams) : '');
}

export function getResource(options: IOptions, path: string, query?: any) {
	return fetch(createUri(options, path, query), createOptions('GET', options));
}

export function postResource(options: IOptions, path: string, query?: any, data?: any) {
	return fetch(createUri(options, path, query), createOptions('POST', options, data));
}

export function putResource(options: IOptions, path: string, query?: any, data?: any) {
	return fetch(createUri(options, path, query), createOptions('PUT', options, data));
}

export function deleteResource(options: IOptions, path: string) {
	return fetch(createUri(options, path), createOptions('DELETE', options));
}

export function deserializeJSON(_key: string, value: any) {
	if (typeof value === 'string') {
		const regexp = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/.exec(value);
		if (regexp) {
			return new Date(value);
		}
	}
	return value;
}

export function getErrorMessageFromUnknownError(error: unknown) {
	if (error) {
		if (typeof error === 'object' && 'message' in error) {
			return error.message;
		} else {
			return `${error}`;
		}
	} else {
		return null;
	}
}

/**
 * Custom suggest function for autocomplete prompts.
 * Searches in both the title (display text) and value (actual value) fields.
 * This allows users to search by UID even when it's shown in parentheses in the title.
 *
 * @example
 * ```typescript
 * const response = await prompts({
 *     type: 'autocomplete',
 *     name: 'deviceUid',
 *     message: 'Select device',
 *     choices: devices.map(d => ({ title: `${d.name} (${d.uid})`, value: d.uid })),
 *     suggest: autocompleteSuggest,
 * });
 * ```
 */
export function autocompleteSuggest<T extends prompts.Choice>(input: string, choices: T[]): Promise<T[]> {
	const searchTerm = input.toLowerCase();
	return Promise.resolve(
		choices.filter((choice) => choice.title?.toLowerCase().includes(searchTerm) || choice.value?.toLowerCase().includes(searchTerm)),
	);
}
