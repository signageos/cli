import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs-extra';
import { log } from '@signageos/sdk/dist/Console/log';
import { getConfigFilePath } from '@signageos/sdk/dist/SosHelper/sosControlHelper';
import {
	requestDeviceCode,
	pollForToken,
	saveStoredTokens,
	writeProfileField,
	profileExists as checkProfileExists,
} from '@signageos/cli-common';
import { getAuth0Settings } from './auth0Settings';
import { getGlobalProfile } from '../Command/globalArgs';
import { createCommandDefinition } from '../Command/commandDefinition';

/**
 * Authenticates the user via the Auth0 Device Authorization Flow.
 * Opens a browser-based verification page where the user logs in,
 * then stores the resulting JWT tokens in `~/.sosrc`.
 *
 * @group Authentication:1
 *
 * @example
 * ```bash
 * # Interactive login (opens browser for Auth0 authentication)
 * sos login
 *
 * # Login with a specific profile
 * sos --profile staging login
 * ```
 *
 * @since 4.0.0
 */
export const login = createCommandDefinition({
	name: 'login',
	description: 'Authenticate user with signageOS via Auth0',
	optionList: [],
	commands: [],
	async run() {
		const profile = getGlobalProfile();
		const configFilePath = getConfigFilePath();

		// Detect a new (non-existent) named profile and prompt for the API URL
		if (profile) {
			const exists = (await fs.pathExists(configFilePath)) && checkProfileExists(profile);
			if (!exists) {
				log('info', `Profile "${profile}" does not exist in ${configFilePath}. Please enter the server API URL to create it.`);
				const { inputApiUrl } = await prompts({
					type: 'text',
					name: 'inputApiUrl',
					message: 'Server API URL',
					initial: 'https://api.signageos.io',
					validate: (v: string) => (v.startsWith('http') ? true : 'Must be a valid URL starting with http'),
				});
				if (!inputApiUrl) {
					throw new Error('API URL is required to log in.');
				}
				writeProfileField('apiUrl', inputApiUrl.replace(/\/+$/, ''), profile);
			}
		}

		const auth0 = getAuth0Settings();

		log('info', 'Starting Auth0 Device Authorization Flow...');
		const deviceCode = await requestDeviceCode(auth0);

		const verificationUrl = deviceCode.verification_uri_complete ?? deviceCode.verification_uri;

		console.info('');
		console.info(chalk.bold('To authenticate, open this URL in your browser:'));
		console.info(chalk.cyan.underline(verificationUrl));
		console.info('');
		if (!deviceCode.verification_uri_complete) {
			console.info(`Then enter this code: ${chalk.bold.yellow(deviceCode.user_code)}`);
			console.info('');
		}
		console.info(chalk.dim(`Waiting for authorization (expires in ${Math.round(deviceCode.expires_in / 60)} minutes)...`));

		const tokens = await pollForToken(auth0, deviceCode.device_code, deviceCode.interval, deviceCode.expires_in);

		saveStoredTokens(tokens, profile);

		log('info', `Successfully authenticated. Credentials are stored in ${chalk.blue(configFilePath)}`);
	},
});
