
import fetch from 'node-fetch';
import { stringify } from 'querystring';
import { RequestInit } from "node-fetch";

export interface IOptions {
	url: string;
	auth: {
		clientId: string;
		secret: string;
	};
	version: 'v1';
	headers?: { [name: string]: string };
}

export function createOptions(method: 'POST' | 'GET' | 'PUT' | 'DELETE', options: IOptions, data?: any): RequestInit {
	return {
		headers: {
			'Content-Type': 'application/json',
			'X-Auth': options.auth.clientId + ':' + options.auth.secret,
			...options.headers || {},
		},
		method,
		body: typeof data !== 'undefined' ? JSON.stringify(data) : undefined,
	};
}

export function createUri(options: IOptions, resource: string, queryParams?: any) {
	return [options.url, options.version, resource].join('/')
		+ (typeof queryParams !== 'undefined' ? '?' + stringify(queryParams) : '');
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
