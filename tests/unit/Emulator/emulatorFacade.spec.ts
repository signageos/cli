import should from 'should';
import sinon from 'sinon';
import { stubSdkFetch } from '../sdkFetchMock';

const rewireMock = require('rewiremock').default;

const loadConfigStub = sinon.stub();
const updateConfigStub = sinon.stub();

rewireMock('../RunControl/runControlHelper').with({ loadConfig: loadConfigStub, updateConfig: updateConfigStub });
rewireMock.enable();
import { loadEmulatorOrCreateNewAndReturnUid } from '../../../src/Emulator/emulatorFacade';
rewireMock.disable();

describe('emulatorFacade', function () {
	const config = {
		apiUrl: 'https://api.example.com',
		accessToken: 'account-access-token',
		defaultOrganizationUid: 'default-organization-uid',
	};
	let fetchStub: sinon.SinonStub;
	let logStub: sinon.SinonStub;

	beforeEach(function () {
		loadConfigStub.reset();
		updateConfigStub.reset();
		const emulators = [{ uid: 'emulator-uid', duid: 'emulator-duid', name: 'Emulator', createdAt: '2026-01-01T00:00:00.000Z' }];
		fetchStub = stubSdkFetch(() => ({ body: emulators }));
		logStub = sinon.stub(require('@signageos/sdk/dist/Console/log'), 'log');
	});

	afterEach(function () {
		sinon.restore();
	});

	it('should list emulators of the given organization, not the default one', async function () {
		loadConfigStub.resolves(config);

		const emulatorUid = await loadEmulatorOrCreateNewAndReturnUid('target-organization-uid');

		should(emulatorUid).equal('emulator-duid');
		const url = new URL(fetchStub.firstCall.args[0]);
		should(url.pathname).equal('/v1/emulator');
		should(url.searchParams.get('organizationUid')).equal('target-organization-uid');
	});

	it('should name the organization when the saved emulator is not in it', async function () {
		loadConfigStub.resolves({ ...config, emulatorUid: 'other-organization-emulator-duid' });

		const emulatorUid = await loadEmulatorOrCreateNewAndReturnUid('target-organization-uid');

		should(emulatorUid).equal('emulator-duid');
		should(logStub.calledWith('warning', sinon.match('is not in organization target-organization-uid'))).be.true();
		should(updateConfigStub.calledOnceWithExactly({ emulatorUid: 'emulator-duid' })).be.true();
	});
});
