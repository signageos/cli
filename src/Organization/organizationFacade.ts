import chalk from 'chalk';
import debug from 'debug';
import prompts from 'prompts';
import { getResource, deserializeJSON, getApiUrl } from '../helper';
import { loadConfig, updateConfig } from '../RunControl/runControlHelper';
import { CommandLineOptions } from '../Command/commandDefinition';
import { ApiVersions } from '@signageos/sdk/dist/RestApi/apiVersions';
const Debug = debug('@signageos/cli:Organization:facade');

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

export const ORGANIZATION_OPTIONS = [ORGANIZATION_UID_OPTION, NO_DEFAULT_ORGANIZATION_OPTION];

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
		if (organizationUid && !options['no-default-organization']) {
			const response = await prompts({
				type: 'confirm',
				name: 'setDefault',
				message: `Do you want to set the organization as a default for current profile?`,
				initial: false,
			});
			if (response.setDefault) {
				await updateConfig({
					defaultOrganizationUid: organizationUid,
				});
			}
		}
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
		Debug('Organization selected', response.organizationUid);
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
		url: getApiUrl(config),
		auth: {
			clientId: config.identification,
			secret: config.apiSecurityToken,
		},
		version: ApiVersions.V1,
	};
	const responseOfGet = await getResource(options, ORGANIZATION_RESOURCE);
	const bodyOfGet = JSON.parse(await responseOfGet.text(), deserializeJSON);
	Debug('GET organizations response', bodyOfGet);
	if (responseOfGet.status === 200) {
		return bodyOfGet;
	} else if (responseOfGet.status === 403) {
		throw new Error(`Authentication error. Try to login using ${chalk.green('sos login')}`);
	} else {
		throw new Error('Unknown error: ' + (bodyOfGet?.message ? bodyOfGet.message : responseOfGet.status));
	}
}

export async function getOrganization(organizationUid: string): Promise<IOrganization> {
	const ORGANIZATION_RESOURCE = 'organization';
	const config = await loadConfig();
	const options = {
		url: getApiUrl(config),
		auth: {
			clientId: config.identification,
			secret: config.apiSecurityToken,
		},
		version: ApiVersions.V1,
	};
	const responseOfGet = await getResource(options, ORGANIZATION_RESOURCE + '/' + organizationUid);
	const bodyOfGet = JSON.parse(await responseOfGet.text(), deserializeJSON);
	Debug('GET organization response', bodyOfGet);
	if (responseOfGet.status === 200) {
		return bodyOfGet;
	} else if (responseOfGet.status === 403) {
		throw new Error(`Authentication error. Try to login using ${chalk.green('sos login')}`);
	} else {
		throw new Error('Unknown error: ' + (bodyOfGet?.message ? bodyOfGet.message : responseOfGet.status));
	}
}
