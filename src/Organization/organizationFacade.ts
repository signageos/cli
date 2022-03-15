import chalk from 'chalk';
import * as Debug from 'debug';
import * as prompts from 'prompts';
import { getResource, deserializeJSON } from '../helper';
import { loadConfig } from '../RunControl/runControlHelper';
import { getGlobalApiUrl } from '../Command/commandProcessor';
import { CommandLineOptions } from '../Command/commandDefinition';
const debug = Debug('@signageos/cli:Organization:facade');

export interface IOrganization {
	uid: string;
	name: string;
	title: string;
	createdAt: string;
	oauthClientId: string;
	oauthClientSecret: string;
}

export const ORGANIZATION_UID_OPTION = { name: 'organization-uid', type: String, description: 'Organization UID' } as const;
export const NO_DEFAULT_ORGANIZATION_OPTION = {
	name: 'no-default-organization',
	type: Boolean,
	description: 'Prevent using the defaultOrganizationUid from ~/.sosrc which were set using command sos organization set-default',
} as const;

export const ORGANIZATION_OPTIONS = [
	ORGANIZATION_UID_OPTION,
	NO_DEFAULT_ORGANIZATION_OPTION,
];

export async function getOrganizationUidOrDefaultOrSelect(
	options: CommandLineOptions<[typeof ORGANIZATION_UID_OPTION, typeof NO_DEFAULT_ORGANIZATION_OPTION]>,
): Promise<string> {
	const config = await loadConfig();
	let organizationUid: string | undefined = options['organization-uid'];

	if (!organizationUid && !options['no-default-organization']) {
		organizationUid = config.defaultOrganizationUid;
	}

	if (!organizationUid) {
		organizationUid = await selectOrganizationUid(options);
	}

	return organizationUid;
}

export async function selectOrganizationUid(options: CommandLineOptions<[typeof ORGANIZATION_UID_OPTION]>) {
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
