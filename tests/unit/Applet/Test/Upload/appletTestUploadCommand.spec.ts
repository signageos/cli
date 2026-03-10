import should from 'should';
import * as sinon from 'sinon';
const rewireMock = require('rewiremock').default;
import organizationFacadeMock from '../../../Organization/organizationFacadeMock';
import { createPage } from '../../../helper/createPage';

// Page 1: 'test-page1-suite' with binary matching what's on disk (no update needed).
// Page 2: 'test-page2-suite' — should be deleted because it's NOT in testFiles.
const page2TestSuites = createPage([{ identifier: 'test-page2-suite', binary: 'old-content' }]);
const page1TestSuites = createPage([{ identifier: 'test-page1-suite', binary: 'current-content' }], page2TestSuites);

const deleteStub = sinon.stub().resolves();

const mockRestApi = {
	applet: {
		get: sinon.fake.resolves({ uid: 'applet-uid', name: 'TestApplet' }),
		version: { get: sinon.fake.resolves({ version: '1.0.0' }) },
		tests: {
			list: sinon.fake.resolves(page1TestSuites),
			create: sinon.stub().resolves(),
			update: sinon.stub().resolves(),
			delete: deleteStub,
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
rewireMock('../../appletValidation').with({ validateAppletDirectory: sinon.fake.resolves(undefined) });
rewireMock('../../../CommandLine/progressBarFactory').with({
	createProgressBar: sinon.fake(() => ({
		init: sinon.fake(),
		update: sinon.fake(),
		end: sinon.fake(),
	})),
});
// testFiles from package.json: only 'test-page1-suite' is intentional.
// 'test-page2-suite' (page 2) is an orphan and should be deleted.
rewireMock('@signageos/sdk/dist/FileSystem/packageConfig').with({
	loadPackage: sinon.fake.resolves({ sos: { tests: ['test-page1-suite'] } }),
});
rewireMock('./appletTestUploadFacade').with({
	validateTestFiles: sinon.fake.resolves(undefined),
	loadTestFilesContents: sinon.fake.resolves({ 'test-page1-suite': 'current-content' }),
});
rewireMock('prompts').with(sinon.fake.resolves({ continue: true }));
rewireMock.enable();
import { appletTestUpload } from '../../../../../src/Applet/Test/Upload/appletTestUploadCommand';
rewireMock.disable();

describe('appletTestUploadCommand', function () {
	describe('appletTestUpload', function () {
		it('should delete a test suite that exists only on the second page', async function () {
			// 'test-page2-suite' lives on page 2 of restApi.applet.tests.list().
			// It is NOT in the local testFiles → it should be deleted (it's an orphan on the server).
			// Without pagination: testSuitesMap only has page 1 → identifiersToDelete is empty → delete never called.
			// With pagination: testSuitesMap includes page 2 → identifiersToDelete = ['test-page2-suite'] → delete IS called.
			deleteStub.resetHistory();

			type Args = Parameters<typeof appletTestUpload.run>[0];
			await appletTestUpload.run({ yes: true } satisfies Partial<Args> as Args); // TODO: run should accept Partial options

			// FAILS now: deleteStub is never called because 'test-page2-suite' is invisible (page 2 not fetched).
			// PASSES after fix: pagination exposes it, delete is called once with the correct identifier.
			should(deleteStub.calledOnce).be.true();
			should(deleteStub.getCall(0).args[2]).equal('test-page2-suite');
		});
	});
});
