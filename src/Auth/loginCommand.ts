import chalk from 'chalk';
import prompts from 'prompts';
import debug from 'debug';
import * as os from 'os';
import { ApiVersions } from '@signageos/sdk/dist/RestApi/apiVersions';
import { log } from '@signageos/sdk/dist/Console/log';
import { getConfigFilePath } from '@signageos/sdk/dist/SosHelper/sosControlHelper';
import { deserializeJSON, getApiUrl, postResource } from '../helper';
import { saveConfig, loadConfig } from '../RunControl/runControlHelper';
import { parameters } from '../parameters';
import { CommandLineOptions, createCommandDefinition } from '../Command/commandDefinition';

const Debug = debug('@signageos/cli:Auth:login');

const OPTION_LIST = [{ name: 'username', type: String, description: `Username or e-mail used for authentication` }] as const;

/**
 * To explicitly enable auth0 authentication add flag --auth0-enabled to command line options
 * { _unknown: [ '--auth0-enabled' ], command: [ 'login' ] }
 *
 * To explicitly enable legacy authentication add flag --legacy-enabled to command line options
 * { _unknown: [ '--legacy-enabled' ], command: [ 'login' ] }
 *
 * Only one from auth0 and legacy authentication can be active at the moment
 */
export const getIsAuth0OrLegacyEnabled = (options: any) => {
	const queryParams: {
		isAuth0Enabled?: boolean;
		isLegacyEnabled?: boolean;
	} = {};

	if (options._unknown?.includes('--auth0-enabled')) {
		queryParams.isAuth0Enabled = true;
	}

	if (options._unknown?.includes('--legacy-enabled')) {
		queryParams.isLegacyEnabled = true;
	}

	if (queryParams.isAuth0Enabled !== undefined && queryParams.isLegacyEnabled !== undefined) {
		throw new Error('Only one override from auth0 and legacy authentication options can be active at the moment.');
	}

	return queryParams;
};

/**
 * Handles user authentication using username/email and password credentials.
 * Supports both Auth0 and legacy authentication methods. Stores credentials
 * securely in the ~/.sosrc configuration file for subsequent CLI operations.
 *
 * @group Authentication:1
 *
 * @example
 * ```bash
 * # Interactive login (prompts for username and password)
 * sos login
 *
 * # Login with username specified
 * sos login --username user@example.com
 *
 * # Enable Auth0 authentication
 * sos login --auth0-enabled
 *
 * # Enable legacy authentication
 * sos login --legacy-enabled
 * ```
 *
 * @throws {Error} When username is missing and not provided interactively
 * @throws {Error} When both Auth0 and legacy authentication flags are specified
 *
 * @since 0.3.0
 */
export const login = createCommandDefinition({
	name: 'login',
	description: 'Authenticate user with signageOS',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		let identification: string | undefined = options.username;
		const config = await loadConfig();
		const apiUrl = getApiUrl(config);
		// Extract domain from API URL to show in prompts
		const apiUrlObj = new URL(apiUrl);
		const hostToDisplay = apiUrlObj.hostname;

		if (!identification) {
			const response = await prompts({
				type: 'text',
				name: 'username',
				message: `Type your username or e-mail used for ${hostToDisplay}`,
			});
			identification = response.username;
		}

		if (!identification) {
			throw new Error('Missing argument --username <string>');
		}
		const { password } = await prompts({
			type: 'password',
			name: 'password',
			message: `Type your password used for ${hostToDisplay}`,
		});

		const authQueryParams = getIsAuth0OrLegacyEnabled(options);

		const {
			id: tokenId,
			securityToken: apiSecurityToken,
			name,
		} = await getOrCreateApiSecurityToken({
			identification,
			password,
			apiUrl,
			...authQueryParams,
		});

		await saveConfig({
			apiUrl: apiUrl !== parameters.apiUrl ? apiUrl : undefined,
			identification: tokenId,
			apiSecurityToken,
		});

		log(
			'info',
			`User ${chalk.green(identification)} has been logged in with token "${name}". Credentials are stored in ${chalk.blue(
				getConfigFilePath(),
			)}`,
		);
	},
});

interface ILoginResponseBody {
	id: string;
	securityToken: string;
	name: string;
}

async function getOrCreateApiSecurityToken({
	identification,
	password,
	apiUrl,
	isAuth0Enabled,
	isLegacyEnabled,
}: {
	identification: string;
	password: string;
	apiUrl: string;
	isAuth0Enabled?: boolean;
	isLegacyEnabled?: boolean;
}): Promise<ILoginResponseBody> {
	const ACCOUNT_SECURITY_TOKEN_RESOURCE = 'account/security-token';
	const options = {
		url: apiUrl,
		auth: { clientId: undefined, secret: undefined },
		version: ApiVersions.V1,
	};
	const tokenName = generateTokenName();

	const requestBody = {
		identification,
		password,
		name: tokenName,
		...(isAuth0Enabled !== undefined ? { isAuth0AuthenticationEnabled: isAuth0Enabled } : {}),
		...(isLegacyEnabled !== undefined ? { isLegacyAuthenticationEnabled: isLegacyEnabled } : {}),
	};

	const response = await postResource(options, ACCOUNT_SECURITY_TOKEN_RESOURCE, null, requestBody);
	const responseBody = JSON.parse(await response.text(), deserializeJSON);

	// Don't log sensitive response data
	Debug('POST security-token response status', response.status);

	if (response.status === 201) {
		return responseBody;
	} else if (response.status === 403) {
		throw new Error(`Incorrect username or password`);
	} else {
		// Ensure password is not logged in error messages
		const errorMessage = responseBody?.message ?? `HTTP status ${response.status}`;
		throw new Error('Unknown error: ' + errorMessage);
	}
}

function generateTokenName() {
	const hostname = os.hostname();
	const shortHostname = hostname.split('.')[0];
	const userInfo = os.userInfo();

	return `${userInfo.username}@${shortHostname}`;
}
