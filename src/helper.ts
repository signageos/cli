import fetch, { RequestInit } from 'node-fetch';
import { stringify } from 'querystring';
// import { RequestInit } from 'node-fetch';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import IRestApiOptions from '@signageos/sdk/dist/RestApi/IOptions';
import { loadConfig } from './RunControl/runControlHelper';
import { ApiVersions } from '@signageos/sdk/dist/RestApi/apiVersions';
import { parameters } from './parameters';
import { getGlobalApiUrl } from './Command/globalArgs';
import { IConfig } from '@signageos/sdk/dist/SosHelper/sosControlHelper';

interface ICredentials {
	oauthClientId: string;
	oauthClientSecret: string;
}

export async function loadApiUrl() {
	const config = await loadConfig();
	return getApiUrl(config);
}

export function getApiUrl(config: IConfig) {
	const apiUrl = getGlobalApiUrl() || config.apiUrl;
	if (!apiUrl) {
		throw new Error(`No API URL is defined. Please use --api-url or set SOS_API_URL environment variable.`);
	}
	return apiUrl;
}

export function createClientVersions() {
	return {
		['signageOS_CLI']: parameters.version,
	};
}

export async function createOrganizationRestApi(credentials: ICredentials) {
	const options: IRestApiOptions = {
		url: await loadApiUrl(),
		auth: {
			clientId: credentials.oauthClientId,
			secret: credentials.oauthClientSecret,
		},
		version: ApiVersions.V1,
		clientVersions: createClientVersions(),
	};
	const accountOptions: IRestApiOptions = {
		...options,
	};

	return new RestApi(options, accountOptions);
}

export async function createFirmwareVersionRestApi() {
	const config = await loadConfig();
	if (!config.identification || !config.apiSecurityToken) {
		throw new Error('Identification or token is missing.');
	}
	const options: IRestApiOptions = {
		url: getApiUrl(config),
		auth: {
			clientId: config.identification,
			secret: config.apiSecurityToken,
		},
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
	version: ApiVersions;
	headers?: { [name: string]: string };
}

export function createOptions(method: 'POST' | 'GET' | 'PUT' | 'DELETE', options: IOptions, data?: any): RequestInit {
	return {
		headers: {
			'Content-Type': 'application/json',
			[AUTH_HEADER]: options.auth.clientId + ':' + options.auth.secret,
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
