import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'dotenv';
import should from 'should';
import sinon from 'sinon';
import { docsSearch, getDocsUrl } from '../../../src/Docs/Search/docsSearchCommand';
import { docs } from '../../../src/Docs/docsCommand';

type RunOptions = Parameters<typeof docsSearch.run>[0];

function options(values: Partial<RunOptions>): RunOptions {
	return {
		command: undefined,
		help: undefined,
		'api-url': undefined,
		version: undefined,
		profile: undefined,
		query: undefined,
		limit: undefined,
		...values,
	};
}

describe('Docs.docsSearchCommand', function () {
	let fetchStub: sinon.SinonStub;
	let stdoutStub: sinon.SinonStub;
	let stderrStub: sinon.SinonStub;
	let originalDocsUrl: string | undefined;

	beforeEach(function () {
		originalDocsUrl = process.env.SOS_DOCS_URL;
		process.env.SOS_DOCS_URL = 'https://docs-proxy.example.com';
		fetchStub = sinon.stub(globalThis, 'fetch');
		stdoutStub = sinon.stub(process.stdout, 'write');
		stderrStub = sinon.stub(process.stderr, 'write');
		process.exitCode = undefined;
	});

	afterEach(function () {
		fetchStub.restore();
		stdoutStub.restore();
		stderrStub.restore();
		process.exitCode = undefined;
		if (originalDocsUrl === undefined) {
			delete process.env.SOS_DOCS_URL;
		} else {
			process.env.SOS_DOCS_URL = originalDocsUrl;
		}
	});

	it('should expose the docs group with the search subcommand', function () {
		should(docs.name).equal('docs');
		should(docs.commands.map((c) => c.name)).deepEqual(['search']);
		should(docsSearch.optionList.map((o) => o.name)).deepEqual(['query', 'limit']);
	});

	it('should prefer SOS_DOCS_URL over the packaged default', function () {
		should(getDocsUrl()).equal('https://docs-proxy.example.com');
	});

	it('should call the proxy and print the results JSON on stdout', async function () {
		fetchStub.resolves(
			new Response('{"query":"supra","results":[{"url":"https://docs.signageos.io/supra","text":"Supra"}]}', { status: 200 }),
		);

		await docsSearch.run(options({ query: 'supra', limit: 3 }));

		should(fetchStub.firstCall.args[0].toString()).equal('https://docs-proxy.example.com/search?q=supra&limit=3');
		should(stdoutStub.firstCall.args[0]).equal('[{"url":"https://docs.signageos.io/supra","text":"Supra"}]\n');
		should(process.exitCode).be.undefined();
	});

	it('should report proxy errors on stderr with exit code 1', async function () {
		fetchStub.resolves(
			new Response('{"error":{"code":"rate_limited","message":"rate limit exceeded"}}', { status: 429, statusText: 'Too Many Requests' }),
		);

		await docsSearch.run(options({ query: 'supra' }));

		should(stderrStub.firstCall.args[0]).equal('HTTP 429 Too Many Requests: rate limit exceeded\n');
		should(process.exitCode).equal(1);
	});

	it('should use the global packaged endpoint and default limit with encoded query text', async function () {
		const originalDefault = process.env.SOS_DEFAULT_DOCS_URL;
		delete process.env.SOS_DOCS_URL;
		process.env.SOS_DEFAULT_DOCS_URL = parse(readFileSync(resolve('.env.production'))).SOS_DEFAULT_DOCS_URL;
		fetchStub.resolves(new Response('{"query":"REST API & devices","results":[]}'));
		try {
			await docsSearch.run(options({ query: ' REST API & devices ' }));
			should(fetchStub.firstCall.args[0].toString()).equal('https://docs-search.signageos.io/search?q=REST+API+%26+devices&limit=5');
			should(stdoutStub.firstCall.args[0]).equal('[]\n');
		} finally {
			if (originalDefault === undefined) {
				delete process.env.SOS_DEFAULT_DOCS_URL;
			} else {
				process.env.SOS_DEFAULT_DOCS_URL = originalDefault;
			}
		}
	});

	it('should preserve optional deployed result metadata', async function () {
		const results = [{ url: 'https://docs.signageos.io/device', text: 'Device provisioning', title: 'Devices', score: 0.75 }];
		fetchStub.resolves(new Response(JSON.stringify({ query: 'device', results })));
		await docsSearch.run(options({ query: 'device', limit: 10 }));
		should(JSON.parse(stdoutStub.firstCall.args[0])).deepEqual(results);
	});

	for (const query of [' ', 'x'.repeat(501)]) {
		it('should reject an empty or oversized query without making a request', async function () {
			await should(docsSearch.run(options({ query }))).be.rejected();
			should(fetchStub.called).be.false();
		});
	}

	for (const limit of [0, -1, 11, 1.5, NaN, Infinity]) {
		it(`should reject invalid limit ${limit} without making a request`, async function () {
			await should(docsSearch.run(options({ query: 'applet', limit }))).be.rejected();
			should(fetchStub.called).be.false();
		});
	}

	it('should reject malformed successful payloads without printing misleading JSON', async function () {
		fetchStub.resolves(new Response('{"results":[{"text":"missing URL"}]}'));
		await should(docsSearch.run(options({ query: 'applet' }))).be.rejected();
		should(stdoutStub.called).be.false();
	});

	it('should report plain-text HTTP errors without printing results', async function () {
		fetchStub.resolves(new Response('Service unavailable', { status: 503, statusText: 'Service Unavailable' }));
		await docsSearch.run(options({ query: 'applet' }));
		should(stderrStub.firstCall.args[0]).equal('HTTP 503 Service Unavailable: Service unavailable\n');
		should(stdoutStub.called).be.false();
		should(process.exitCode).equal(1);
	});

	it('should propagate transport failures without printing results', async function () {
		fetchStub.rejects(new Error('connection failed'));
		await should(docsSearch.run(options({ query: 'applet' }))).be.rejectedWith(/connection failed/);
		should(stdoutStub.called).be.false();
	});

	it('should require --query', async function () {
		await should(docsSearch.run(options({}))).be.rejectedWith(/--query/);
		should(fetchStub.called).be.false();
	});
});
