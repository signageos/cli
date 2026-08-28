import Debug from 'debug';
import should from 'should';
import * as sinon from 'sinon';
import { getOrganization } from '../../../src/Organization/organizationFacade';

describe('organizationFacade', function () {
	const ENV_KEYS = ['SOS_ACCESS_TOKEN', 'SOS_API_URL'] as const;
	const savedEnv: Record<string, string | undefined> = {};
	let originalDebugLog: typeof Debug.log;
	let originalDebugNamespaces: string;

	beforeEach(function () {
		for (const key of ENV_KEYS) {
			savedEnv[key] = process.env[key];
		}
		process.env.SOS_ACCESS_TOKEN = 'account-access-token';
		process.env.SOS_API_URL = 'https://api.example.com';
		originalDebugLog = Debug.log;
		originalDebugNamespaces = Debug.disable();
		Debug.enable('@signageos/cli:Organization:facade');
	});

	afterEach(function () {
		sinon.restore();
		Debug.log = originalDebugLog;
		Debug.enable(originalDebugNamespaces);
		for (const key of ENV_KEYS) {
			if (savedEnv[key] === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = savedEnv[key];
			}
		}
	});

	it('should not write organization OAuth credentials to debug output', async function () {
		const oauthClientId = 'sensitive-client-id';
		const oauthClientSecret = 'sensitive-client-secret';
		const debugOutput: string[] = [];
		Debug.log = (...args: unknown[]) => {
			debugOutput.push(args.map(String).join(' '));
		};
		sinon.stub(globalThis, 'fetch').resolves(
			new Response(
				JSON.stringify({
					uid: 'organization-uid',
					name: 'Organization',
					oauthClientId,
					oauthClientSecret,
				}),
				{ status: 200 },
			),
		);

		await getOrganization('organization-uid');

		const output = debugOutput.join('\n');
		should(output).not.containEql(oauthClientId);
		should(output).not.containEql(oauthClientSecret);
		should(output).containEql('organization-uid');
		should(output).containEql('200');
	});
});
