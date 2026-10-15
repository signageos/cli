import { readFile } from 'fs/promises';
import { ApiVersions } from '@signageos/sdk/dist/RestApi/apiVersions';
import { createOptions, getApiUrl, IOptions } from '../helper';
import { loadConfig } from '../RunControl/runControlHelper';

export const API_METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const;
export type ApiMethod = (typeof API_METHODS)[number];

export function isApiMethod(method: string): method is ApiMethod {
	return API_METHODS.some((candidate) => candidate === method);
}

export interface IApiRequest {
	method: ApiMethod;
	path: string;
	/** Inline JSON, or `@path/to/file.json` */
	data?: string;
	/** Appended as `organizationUid` query param for access-token auth only */
	organizationUid?: string;
}

export interface IApiResponse {
	status: number;
	statusText: string;
	body: string;
}

/**
 * Resolves the request URL. The path is always relative to the API URL, so it cannot
 * change the host; `--api-url` and `SOS_API_URL` still can, and receive the stored credentials.
 */
export function buildRequestUrl(apiUrl: string, path: string, organizationUid: string | undefined): URL {
	// Git Bash (MSYS) rewrites "/v1/..." arguments into Windows paths like "C:/Program Files/Git/v1/..."
	if (/^[a-z]:[\\/]/i.test(path)) {
		throw new Error(
			`--path looks like a Windows file path (got "${path}"). In Git Bash, run with MSYS_NO_PATHCONV=1 so "/" paths are passed unchanged.`,
		);
	}
	if (!path.startsWith('/') || path.startsWith('//')) {
		throw new Error(`--path must start with "/" and be relative to the API URL (got "${path}")`);
	}
	const base = new URL(apiUrl.replace(/\/+$/, '') + '/');
	const url = new URL(path.replace(/^\/+/, ''), base);
	if (url.origin !== base.origin) {
		throw new Error(`--path must stay on ${base.origin}`);
	}
	if (organizationUid && !url.searchParams.has('organizationUid')) {
		url.searchParams.set('organizationUid', organizationUid);
	}
	return url;
}

/** Body from --data: inline JSON or @file. Parsed here so a malformed body fails before any request is sent. */
export async function readData(data: string | undefined): Promise<unknown> {
	if (data === undefined) {
		return undefined;
	}
	const raw = data.startsWith('@') ? await readFile(data.slice(1), 'utf8') : data;
	try {
		return JSON.parse(raw);
	} catch {
		throw new Error('--data must be valid JSON (inline, or @path/to/file.json)');
	}
}

export async function callApi(request: IApiRequest): Promise<IApiResponse> {
	const config = await loadConfig();
	const hasLegacyCredentials = !!config.identification && !!config.apiSecurityToken;
	if (!config.accessToken && !hasLegacyCredentials) {
		throw new Error('Not logged in. Run "sos login" first.');
	}
	const apiUrl = getApiUrl(config);
	// Legacy org credentials already identify the organization; the query param would be rejected.
	const url = buildRequestUrl(apiUrl, request.path, config.accessToken ? request.organizationUid : undefined);
	const options: IOptions = {
		url: apiUrl,
		auth: { clientId: config.identification, secret: config.apiSecurityToken },
		accessToken: config.accessToken,
		version: ApiVersions.V1,
	};
	const init = createOptions(request.method, options, await readData(request.data));
	const response = await fetch(url, { ...init, redirect: 'error' });
	return { status: response.status, statusText: response.statusText, body: await response.text() };
}
