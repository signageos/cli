import should from 'should';
import { createServer, Server } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';

const execute = promisify(execFile);
const cli = join(process.cwd(), 'dist/index.js');

function runCli(args: string[], environment: NodeJS.ProcessEnv = {}) {
	return execute(process.execPath, [cli, ...args], {
		env: { ...process.env, SOS_ACCESS_TOKEN: '', SOS_API_IDENTIFICATION: '', SOS_API_SECURITY_TOKEN: '', ...environment },
		timeout: 15000,
	});
}

describe('agentCommands', function () {
	let server: Server;
	let endpoint: string;
	let requests: string[];
	let responseStatus: number;
	let responseBody: string;
	let expectedAuth: string | undefined;
	let responseHeaders: Record<string, string>;

	beforeEach(async function () {
		requests = [];
		responseStatus = 200;
		expectedAuth = undefined;
		responseHeaders = { 'Content-Type': 'application/json' };
		responseBody = JSON.stringify({
			query: 'REST API & devices',
			results: [{ url: 'https://docs.signageos.io/device', text: 'Device provisioning' }],
		});
		server = createServer((request, response) => {
			requests.push(request.url ?? '');
			should(request.headers['x-auth']).equal(expectedAuth);
			response.writeHead(responseStatus, responseHeaders);
			response.end(responseBody);
		});
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
		const address = server.address();
		if (!address || typeof address === 'string') {
			throw new Error('Expected a TCP test server');
		}
		endpoint = `http://127.0.0.1:${address.port}`;
	});

	afterEach(async function () {
		await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
	});

	it('should run built documentation search without authentication and emit only results JSON', async function () {
		const result = await runCli(['docs', 'search', '--query', 'REST API & devices'], { SOS_DOCS_URL: `${endpoint}/` });
		should(requests).deepEqual(['/search?q=REST+API+%26+devices&limit=5']);
		should(JSON.parse(result.stdout)).deepEqual([{ url: 'https://docs.signageos.io/device', text: 'Device provisioning' }]);
		should(result.stderr).not.match(/HTTP \d{3}/);
	});

	it('should return a nonzero exit code for search HTTP errors without printing JSON', async function () {
		responseStatus = 503;
		responseBody = '{"error":{"code":"unavailable","message":"temporarily unavailable"}}';
		await should(runCli(['docs', 'search', '--query', 'applet', '--limit', '3'], { SOS_DOCS_URL: endpoint })).be.rejectedWith(
			/HTTP 503 Service Unavailable: temporarily unavailable/,
		);
		should(requests).deepEqual(['/search?q=applet&limit=3']);
	});

	it('should reject invalid search arguments before contacting the server', async function () {
		await should(runCli(['docs', 'search', '--query', 'applet', '--limit', '11'], { SOS_DOCS_URL: endpoint })).be.rejected();
		should(requests).deepEqual([]);
	});

	it('should not follow a redirect or forward stored authentication to another origin', async function () {
		let forwarded = false;
		const destination = createServer((_request, response) => {
			forwarded = true;
			response.end('unexpected');
		});
		await new Promise<void>((resolve) => destination.listen(0, '127.0.0.1', resolve));
		try {
			const address = destination.address();
			if (!address || typeof address === 'string') {
				throw new Error('Expected a TCP redirect destination');
			}
			expectedAuth = 'test-token';
			responseStatus = 302;
			responseHeaders.Location = `http://127.0.0.1:${address.port}/capture`;
			await should(runCli(['api', '--path', '/v2/device', '--api-url', endpoint], { SOS_ACCESS_TOKEN: expectedAuth })).be.rejectedWith(
				/fetch failed/,
			);
			should(requests).deepEqual(['/v2/device']);
			should(forwarded).be.false();
		} finally {
			await new Promise<void>((resolve, reject) => destination.close((error) => (error ? reject(error) : resolve())));
		}
	});

	it('should send an explicitly confirmed write only to the local test API', async function () {
		expectedAuth = 'test-token';
		responseBody = '{"uid":"test-device"}';
		const result = await runCli(
			['api', '--method', 'POST', '--confirm-write', '--path', '/v1/device', '--api-url', endpoint, '--data', '{}'],
			{ SOS_ACCESS_TOKEN: expectedAuth },
		);
		should(requests).deepEqual(['/v1/device']);
		should(result.stdout.trim()).equal(responseBody);
		should(result.stderr).match(/Confirmed POST request; server permissions still apply/);
		should(result.stderr).not.match(/test-token/);
	});

	for (const method of ['POST', 'PUT', 'DELETE']) {
		it(`should block an unconfirmed ${method} before credentials or HTTP traffic`, async function () {
			await should(runCli(['api', '--method', method, '--path', '/v1/device/x', '--api-url', endpoint])).be.rejectedWith(/--confirm-write/);
			should(requests).deepEqual([]);
		});
	}
});
