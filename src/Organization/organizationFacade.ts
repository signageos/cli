import chalk from 'chalk';
import debug from 'debug';
import prompts from 'prompts';
import { getResource, deserializeJSON, getApiUrl, autocompleteSuggest } from '../helper';
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
	description: 'Prevent using the defaultOrganizationUid from ~/.sosrc',
} as const;

export const ORGANIZATION_OPTIONS = [ORGANIZATION_UID_OPTION, NO_DEFAULT_ORGANIZATION_OPTION];

export async function getOrganizationUidOrDefaultOrSelect(
	options: CommandLineOptions<[typeof ORGANIZATION_UID_OPTION, typeof NO_DEFAULT_ORGANIZATION_OPTION]>,
	skipPrompts: boolean = false,
): Promise<string> {
	const config = await loadConfig();
	let organizationUid: string | undefined = options['organization-uid'];

	if (!organizationUid && !options['no-default-organization']) {
		organizationUid = config.defaultOrganizationUid;
	}

	if (!organizationUid) {
		// If skipPrompts is true (e.g., --yes flag), try to auto-select
		if (skipPrompts) {
			const organizations = await getOrganizations();

			if (organizations.length === 0) {
				throw new Error('No organizations available. Please ensure you have access to at least one organization.');
			}

			if (organizations.length === 1) {
				// Auto-select the only available organization
				const org = organizations[0]!; // Safe: we just checked length === 1
				organizationUid = org.uid;
				console.info(chalk.yellow(`Auto-selected organization: ${org.title} (${org.name}, ${org.uid})`));

				// Set as default to avoid prompts in future
				if (!options['no-default-organization']) {
					await updateConfig({
						defaultOrganizationUid: organizationUid,
					});
					console.info(chalk.green('Organization has been set as default for current profile.'));
				}
			} else {
				// Multiple organizations available - cannot auto-select safely
				throw new Error(
					`Cannot auto-select organization: Multiple organizations available (${organizations.length} found).\n` +
						`Please specify one of the following:\n` +
						`  1. Use --organization-uid <uid> flag\n` +
						`  2. Set default organization: sos organization set-default\n` +
						`  3. Remove --yes flag for interactive selection\n\n` +
						`Available organizations:\n` +
						organizations.map((org) => `  - ${org.title} (${org.name}, ${org.uid})`).join('\n'),
				);
			}
		} else {
			// Interactive mode - prompt user to select
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
			suggest: autocompleteSuggest,
		});
		if (!response.organizationUid) {
			throw new Error('Organization selection was cancelled');
		}
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
