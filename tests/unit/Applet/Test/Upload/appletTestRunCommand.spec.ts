import should from 'should';
import * as sinon from 'sinon';
const rewireMock = require('rewiremock').default;
import organizationFacadeMock from '../../../Organization/organizationFacadeMock';
import { createPage } from '../../../helper/createPage';

// Two-page test suite list: page 1 has 'test-page1-suite', page 2 has 'test-page2-suite'.
const page2TestSuites = createPage([{ identifier: 'test-page2-suite' }]);
const page1TestSuites = createPage([{ identifier: 'test-page1-suite' }], page2TestSuites);

const deviceAppletTestRunStub = sinon.stub().resolves();

const mockRestApi = {
	applet: {
		get: sinon.fake.resolves({ uid: 'applet-uid', name: 'TestApplet' }),
		version: { get: sinon.fake.resolves({ version: '1.0.0' }) },
		tests: { list: sinon.fake.resolves(page1TestSuites) },
	},
	device: {
		get: sinon.fake.resolves({ uid: 'device-uid', name: 'TestDevice' }),
		appletTest: {
			run: deviceAppletTestRunStub,
			get: sinon.fake.resolves({
				successfulTests: ['test-page2-suite'],
				failedTests: [],
				pendingTests: [],
				finishedAt: new Date(),
			}),
		},
	},
};

rewireMock('../../../Organization/organizationFacade').with(organizationFacadeMock);
rewireMock('../../../helper').with({ createOrganizationRestApi: sinon.fake.returns(mockRestApi) });
rewireMock('../../appletFacade').with({
	getAppletUid: sinon.fake.resolves('applet-uid'),
	getAppletVersion: sinon.fake.resolves('1.0.0'),
	APPLET_UID_OPTION: { name: 'applet-uid', type: String },
});
rewireMock('../../../Device/deviceFacade').with({
	getDeviceUid: sinon.fake.resolves('device-uid'),
	DEVICE_UID_OPTION: { name: 'device-uid', type: String },
});
rewireMock('../../appletValidation').with({ validateAppletDirectory: sinon.fake.resolves(undefined) });
rewireMock('../../../CommandLine/progressBarFactory').with({
	createProgressBar: sinon.fake(() => ({
		init: sinon.fake(),
		update: sinon.fake(),
		end: sinon.fake(),
	})),
});
rewireMock('../../../Timer/wait').with(sinon.fake.resolves(undefined));
rewireMock('prompts').with(sinon.fake.resolves({ continue: true }));
// Do NOT mock './appletTestRunFacade' — validateTestIdentifiers must remain real
// so the pagination bug is exposed when the test suite from page 2 is not found.
rewireMock.enable();
import { appletTestRun } from '../../../../../src/Applet/Test/Upload/appletTestRunCommand';
rewireMock.disable();

describe('appletTestRunCommand', function () {
	describe('appletTestRun', function () {
		it('should run a test whose identifier exists only on the second page', async function () {
			// 'test-page2-suite' is only on page 2.
			// Without pagination: validateTestIdentifiers throws "test-page2-suite is not in currently
			//   uploaded test suites" before device.appletTest.run is ever called.
			// With pagination: all suites are collected, validation passes, device.appletTest.run is called.
			deviceAppletTestRunStub.resetHistory();

			try {
				type Args = Parameters<typeof appletTestRun.run>[0];
				await appletTestRun.run({ test: ['test-page2-suite'], yes: true } satisfies Partial<Args> as Args); // TODO: run should accept Partial options
			} catch {
				// errors from polling etc. are irrelevant to the pagination assertion
			}

			// FAILS now: run is never reached because validateTestIdentifiers throws first.
			// PASSES after fix: pagination collects page-2 suite, validation succeeds, run IS called.
			should(deviceAppletTestRunStub.calledOnce).be.true();
		});
	});
});
