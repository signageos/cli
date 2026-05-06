import { exec } from 'node:child_process';
import { platform } from 'node:os';
import chalk from 'chalk';
import prompts from 'prompts';
import { log } from '@signageos/sdk/dist/Console/log';
import { getConfigFilePath } from '@signageos/sdk/dist/SosHelper/sosControlHelper';
import { requestDeviceCode, pollForToken, saveStoredTokens, writeProfileField } from '@signageos/cli-common';
import { getAuth0Settings } from './auth0Settings';
import { getGlobalProfile } from '../Command/globalArgs';
import { createCommandDefinition } from '../Command/commandDefinition';

/** Best-effort attempt to open a URL in the user's default browser. */
function openInBrowser(url: string): void {
	const cmd =
		platform() === 'darwin'
			? `open ${JSON.stringify(url)}`
			: platform() === 'win32'
				? `start "" ${JSON.stringify(url)}`
				: `xdg-open ${JSON.stringify(url)}`;
	exec(cmd, (err) => {
		if (err) {
			// Silently ignore — the URL is already printed to the console as a fallback.
		}
	});
}

const LOGIN_OPTION_LIST = [
	{
		name: 'interactive-profile',
		type: Boolean,
		description: 'Prompt for custom Auth0 and connection settings (for custom deployments)',
	},
] as const;

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
 * # Login with custom configuration (prompts for Auth0 and connection settings)
 * sos login --interactive-profile
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
	optionList: LOGIN_OPTION_LIST,
	commands: [],
	async run(options) {
		const profile = getGlobalProfile();
		const configFilePath = getConfigFilePath();
		const interactiveProfile = options['interactive-profile'];

		if (interactiveProfile) {
			log('info', `Setting up custom connection settings in ${configFilePath}.`);

			const { inputApiUrl } = await prompts({
				type: 'text',
				name: 'inputApiUrl',
				message: 'Server API URL',
				initial: process.env.SOS_API_URL ?? 'https://api.signageos.io',
				validate: (v: string) => (v.startsWith('http') ? true : 'Must be a valid URL starting with http'),
			});
			if (!inputApiUrl) {
				throw new Error('API URL is required to log in.');
			}
			writeProfileField('apiUrl', inputApiUrl.replace(/\/+$/, ''), profile);

			const { inputBoxUrl } = await prompts({
				type: 'text',
				name: 'inputBoxUrl',
				message: 'Box URL',
				initial: process.env.SOS_BOX_HOST ?? 'box.signageos.io',
			});
			if (inputBoxUrl) {
				writeProfileField('boxUrl', inputBoxUrl.replace(/\/+$/, ''), profile);
			}

			const { inputAuth0Domain } = await prompts({
				type: 'text',
				name: 'inputAuth0Domain',
				message: 'Auth0 domain',
				initial: process.env.SOS_AUTH0_DOMAIN ?? 'auth0.signageos.io',
			});
			if (inputAuth0Domain) {
				writeProfileField('auth0Domain', inputAuth0Domain, profile);
			}

			const { inputAuth0ClientId } = await prompts({
				type: 'text',
				name: 'inputAuth0ClientId',
				message: 'Auth0 client ID',
				initial: process.env.SOS_AUTH0_CLIENT_ID ?? '',
			});
			if (inputAuth0ClientId) {
				writeProfileField('auth0ClientId', inputAuth0ClientId, profile);
			}

			const { inputAuth0Audience } = await prompts({
				type: 'text',
				name: 'inputAuth0Audience',
				message: 'Auth0 audience',
				initial: process.env.SOS_AUTH0_AUDIENCE ?? '',
			});
			if (inputAuth0Audience) {
				writeProfileField('auth0Audience', inputAuth0Audience, profile);
			}
		}

		const auth0 = getAuth0Settings();

		log('info', 'Starting Auth0 Device Authorization Flow...');
		const deviceCode = await requestDeviceCode(auth0);

		const verificationUrl = deviceCode.verification_uri_complete ?? deviceCode.verification_uri;

		// Try to open the verification URL in the default browser
		openInBrowser(verificationUrl);

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
