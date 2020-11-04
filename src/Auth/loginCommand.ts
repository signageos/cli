import chalk from 'chalk';
import * as prompts from 'prompts';
import * as Debug from 'debug';
import * as os from 'os';
import { CommandLineOptions } from "command-line-args";
import { deserializeJSON, postResource } from '../helper';
import { saveConfig, getConfigFilePath } from '@signageos/sdk/dist/SosHelper/sosControlHelper';
import * as parameters from '../../config/parameters';
import ICommand from '../Command/ICommand';
import { getGlobalApiUrl } from '../Command/commandProcessor';
const debug = Debug('@signageos/cli:Auth:login');

export const login: ICommand = {
	name: 'login',
	description: 'Login account using username & password',
	optionList: [
		{ name: 'username', type: String, description: `Username or e-mail used for ${parameters.boxHost}` },
	],
	commands: [],
	async run(options: CommandLineOptions) {
		let identification: string | undefined = options.username;
		if (!identification) {
			const response = await prompts({
				type: 'text',
				name: 'username',
				message: `Type your username or e-mail used for ${parameters.boxHost}`,
			});
			identification = response.username;
		}
		if (!identification) {
			throw new Error('Missing argument --username <string>');
		}
		const { password } = await prompts({
			type: 'password',
			name: 'password',
			message: `Type your password used for ${parameters.boxHost}`,
		});

		// TODO use @signageos/test api instead
		const { id: tokenId, securityToken: apiSecurityToken, name } = await getOrCreateApiSecurityToken(identification, password);

		await saveConfig({
			identification: tokenId,
			apiSecurityToken,
		});

		console.log(`User ${chalk.green(identification!)} has been logged in with token "${name}". Credentials are stored in ${chalk.blue(getConfigFilePath())}`);
	},
};

interface ILoginResponseBody {
	id: string;
	securityToken: string;
	name: string;
}

async function getOrCreateApiSecurityToken(identification: string, password: string): Promise<ILoginResponseBody> {
	const ACCOUNT_SECURITY_TOKEN_RESOURCE = 'account/security-token';
	const options = {
		url: getGlobalApiUrl(),
		auth: { clientId: undefined, secret: undefined },
		version: 'v1' as 'v1',
	};
	const tokenName = generateTokenName();
	const query = {
		identification,
		password,
		name: tokenName,
	};
	const responseOfPost = await postResource(options, ACCOUNT_SECURITY_TOKEN_RESOURCE, query);
	const bodyOfPost = JSON.parse(await responseOfPost.text(), deserializeJSON);
	debug('POST security-token response', bodyOfPost);
	if (responseOfPost.status === 201) {
		return bodyOfPost;
	} else if (responseOfPost.status === 403) {
		throw new Error(`Incorrect username or password`);
	} else {
		throw new Error('Unknown error: ' + (bodyOfPost && bodyOfPost.message ? bodyOfPost.message : responseOfPost.status));
	}
}

function generateTokenName() {
	const hostname = os.hostname();
	const shortHostname = hostname.split('.')[0];
	const userInfo = os.userInfo();

	return `${userInfo.username}@${shortHostname}`;
}
