import should from 'should';
import sinon from 'sinon';

const rewireMock = require('rewiremock').default;

const callApiStub = sinon.stub();
const loadConfigStub = sinon.stub();
rewireMock('./apiRequest').callThrough().with({ callApi: callApiStub });
rewireMock('../RunControl/runControlHelper').with({ loadConfig: loadConfigStub });
rewireMock.enable();
import { api } from '../../../src/Api/apiCommand';
rewireMock.disable();

type RunOptions = Parameters<typeof api.run>[0];

function options(values: Partial<RunOptions>): RunOptions {
	return {
		command: undefined,
		help: undefined,
		'api-url': undefined,
		version: undefined,
		profile: undefined,
		method: undefined,
		path: undefined,
		data: undefined,
		'confirm-write': undefined,
		'organization-uid': undefined,
		'no-default-organization': undefined,
		...values,
	};
}

describe('Api.apiCommand', function () {
	let stdoutStub: sinon.SinonStub;
	let stderrStub: sinon.SinonStub;

	beforeEach(function () {
		callApiStub.reset();
		loadConfigStub.reset();
		loadConfigStub.resolves({ accessToken: 'tok', defaultOrganizationUid: 'default-org' });
		stdoutStub = sinon.stub(process.stdout, 'write');
		stderrStub = sinon.stub(process.stderr, 'write');
		process.exitCode = undefined;
	});

	afterEach(function () {
		stdoutStub.restore();
		stderrStub.restore();
		process.exitCode = undefined;
	});

	it('should be a leaf command named api', function () {
		should(api.name).equal('api');
		should(api.commands).have.length(0);
		should(api.optionList.map((o) => o.name)).deepEqual([
			'method',
			'path',
			'data',
			'confirm-write',
			'organization-uid',
			'no-default-organization',
		]);
	});

	it('should default to GET, use the default organization and print the body', async function () {
		callApiStub.resolves({ status: 200, statusText: 'OK', body: '[{"uid":"d1"}]' });

		await api.run(options({ path: '/v1/device' }));

		should(callApiStub.firstCall.args[0]).deepEqual({ method: 'GET', path: '/v1/device', data: undefined, organizationUid: 'default-org' });
		should(stdoutStub.firstCall.args[0]).equal('[{"uid":"d1"}]\n');
		should(process.exitCode).be.undefined();
	});

	it('should prefer --organization-uid and honour --no-default-organization', async function () {
		callApiStub.resolves({ status: 200, statusText: 'OK', body: '' });

		await api.run(options({ path: '/v1/device', 'organization-uid': 'explicit' }));
		should(callApiStub.firstCall.args[0].organizationUid).equal('explicit');

		await api.run(options({ path: '/v1/organization', 'no-default-organization': true }));
		should(callApiStub.secondCall.args[0].organizationUid).be.undefined();
	});

	it('should set exit code 1 and report the status on non-2xx', async function () {
		callApiStub.resolves({ status: 403, statusText: 'Forbidden', body: '{"message":"no"}' });

		await api.run({ method: 'post', 'confirm-write': true, path: '/v1/device/x/power-action', data: '{}' } as RunOptions);

		should(callApiStub.firstCall.args[0].method).equal('POST');
		should(stdoutStub.firstCall.args[0]).equal('{"message":"no"}\n');
		should(stderrStub.secondCall.args[0]).equal('HTTP 403 Forbidden\n');
		should(process.exitCode).equal(1);
	});

	for (const method of ['POST', 'PUT', 'DELETE', 'post']) {
		it(`should block ${method} without opt-in before loading credentials or calling the API`, async function () {
			await should(api.run(options({ method, path: '/v1/device/x' }))).be.rejectedWith(/--confirm-write/);
			should(loadConfigStub.called).be.false();
			should(callApiStub.called).be.false();
		});
	}

	for (const method of ['POST', 'PUT', 'DELETE']) {
		it(`should allow an explicitly confirmed ${method} and log opt-in only to stderr`, async function () {
			callApiStub.resolves({ status: 204, statusText: 'No Content', body: '' });

			await api.run(options({ method, path: '/v1/device/x', 'confirm-write': true }));

			should(callApiStub.firstCall.args[0].method).equal(method);
			should(stderrStub.firstCall.args[0]).equal(`Confirmed ${method} request; server permissions still apply.\n`);
			should(stdoutStub.called).be.false();
		});
	}

	it('should reject --data with GET before loading credentials or calling the API', async function () {
		await should(api.run(options({ path: '/v2/device', data: '{}' }))).be.rejectedWith(/--data cannot be used with GET/);
		should(loadConfigStub.called).be.false();
		should(callApiStub.called).be.false();
	});

	it('should reject an unknown method and a missing path before calling the API', async function () {
		await should(api.run(options({ method: 'PATCH', path: '/v1/device' }))).be.rejectedWith(/--method must be one of/);
		await should(api.run(options({}))).be.rejectedWith(/--path/);
		should(callApiStub.called).be.false();
	});
});
