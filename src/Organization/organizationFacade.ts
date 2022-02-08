import * as chalk from 'chalk';
import * as Debug from 'debug';
import * as prompts from 'prompts';
import { CommandLineOptions } from 'command-line-args';
import { getResource, deserializeJSON } from '../helper';
import { loadConfig } from '../RunControl/runControlHelper';
import { getGlobalApiUrl } from '../Command/commandProcessor';
const debug = Debug('@signageos/cli:Organization:facade');

export interface IOrganization {
	uid: string;
	name: string;
	title: string;
	createdAt: string;
	oauthClientId: string;
	oauthClientSecret: string;
}

export const ORGANIZATION_UID_OPTION = { name: 'organization-uid', type: String, description: 'Organization UID' };

export async function getOrganizationUid(options: CommandLineOptions) {
	let organizationUid: string | undefined = options['organization-uid'];
	if (!organizationUid) {
		const organizations = await getOrganizations();
		const response = await prompts({
			type: 'autocomplete',
			name: 'organizationUid',
			message: `Select organization to use`,
			choices: organizations.map((org: IOrganization) => ({
				title: `${org.title} (${org.name}, ${org.uid})`,
				value: org.uid,
			})),
		});
		debug('Organization selected', response.organizationUid);
		organizationUid = response.organizationUid;
	}
	if (!organizationUid) {
		throw new Error('Missing argument --organization-uid <string>');
	}
	return organizationUid;
}

export async function getOrganizations(): Promise<IOrganization[]> {
	const ORGANIZATION_RESOURCE = 'organization';
	const config = await loadConfig();
	const options = {
		url: getGlobalApiUrl(),
		auth: {
			clientId: config.identification,
			secret: config.apiSecurityToken,
		},
		version: 'v1' as 'v1',
	};
	const responseOfGet = await getResource(options, ORGANIZATION_RESOURCE);
	const bodyOfGet = JSON.parse(await responseOfGet.text(), deserializeJSON);
	debug('GET organizations response', bodyOfGet);
	if (responseOfGet.status === 200) {
		return bodyOfGet;
	} else if (responseOfGet.status === 403) {
		throw new Error(`Authentication error. Try to login using ${chalk.green('sos login')}`);
	} else {
		throw new Error('Unknown error: ' + (bodyOfGet && bodyOfGet.message ? bodyOfGet.message : responseOfGet.status));
	}
}

export async function getOrganization(organizationUid: string): Promise<IOrganization> {
	const ORGANIZATION_RESOURCE = 'organization';
	const config = await loadConfig();
	const options = {
		url: getGlobalApiUrl(),
		auth: {
			clientId: config.identification,
			secret: config.apiSecurityToken,
		},
		version: 'v1' as 'v1',
	};
	const responseOfGet = await getResource(options, ORGANIZATION_RESOURCE + '/' + organizationUid);
	const bodyOfGet = JSON.parse(await responseOfGet.text(), deserializeJSON);
	debug('GET organization response', bodyOfGet);
	if (responseOfGet.status === 200) {
		return bodyOfGet;
	} else if (responseOfGet.status === 403) {
		throw new Error(`Authentication error. Try to login using ${chalk.green('sos login')}`);
	} else {
		throw new Error('Unknown error: ' + (bodyOfGet && bodyOfGet.message ? bodyOfGet.message : responseOfGet.status));
	}
}
