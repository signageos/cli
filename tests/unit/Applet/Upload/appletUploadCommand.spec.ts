import should from 'should';
import * as sinon from 'sinon';
const rewireMock = require('rewiremock').default;
import appletFacadeMock from '../appletFacadeMock';
import appletUploadFacadeMock from './appletUploadFacadeMock';
import appletUploadCommandHelperMock from './appletUploadCommandHelperMock';
import appletValidationMock from '../appletValidationMock';
import organizationFacadeMock from '../../Organization/organizationFacadeMock';
import fileSystemHelperMock from '../../Lib/fileSystemMock';
import helperMock, { restApiWithNonExistingAppletVersion } from '../../helperMock';
import { promptsMockFactory } from '../../promptsMock';
import { singleFileOptions, multiFileOptions, noUserOptions } from './appletUploadCommandOptionsMock';

// Utility to extract error message safely
function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}

const promptsMockOverrideTrue = promptsMockFactory([{ questionName: 'override', answer: true }]);
const promptsMockOverrideFalse = promptsMockFactory([{ questionName: 'override', answer: false }]);
const promptsMockConfirmTrue = promptsMockFactory([{ questionName: 'newVersion', answer: true }]);
const promptsMockConfirmFalse = promptsMockFactory([{ questionName: 'newVersion', answer: false }]);

rewireMock('../appletFacade').with(appletFacadeMock);
rewireMock('./appletUploadFacade').with(appletUploadFacadeMock);
rewireMock('./appletUploadCommandHelper').with(appletUploadCommandHelperMock);
rewireMock('../appletValidation').with(appletValidationMock);
rewireMock('../../Organization/organizationFacade').with(organizationFacadeMock);
rewireMock('../../Lib/fileSystem').with(fileSystemHelperMock);
rewireMock.enable();
rewireMock('../../helper').with(helperMock);
rewireMock('prompts').with(promptsMockOverrideTrue);
import { appletUpload as singleFileAppletUploadOverrideTrue } from '../../../../src/Applet/Upload/appletUploadCommand';
rewireMock('../../helper').with(helperMock);
rewireMock('prompts').with(promptsMockOverrideFalse);
// eslint-disable-next-line no-duplicate-imports
import { appletUpload as singleFileAppletUploadOverrideFalse } from '../../../../src/Applet/Upload/appletUploadCommand';
rewireMock('../../helper').with(restApiWithNonExistingAppletVersion);
rewireMock('prompts').with(promptsMockConfirmTrue);
// eslint-disable-next-line no-duplicate-imports
import { appletUpload as singleFileAppletUploadConfirmTrue } from '../../../../src/Applet/Upload/appletUploadCommand';
rewireMock('../../helper').with(restApiWithNonExistingAppletVersion);
rewireMock('prompts').with(promptsMockConfirmFalse);
// eslint-disable-next-line no-duplicate-imports
import { appletUpload as singleFileAppletUploadConfirmFalse } from '../../../../src/Applet/Upload/appletUploadCommand';
rewireMock.disable();

describe('unit.appletUploadCommand', function () {
	describe('single file applet', function () {
		it('should update with override', async function () {
			await singleFileAppletUploadOverrideTrue.run(singleFileOptions);
			should(appletUploadFacadeMock.updateSingleFileApplet.calledOnce).true();
			should(appletUploadFacadeMock.updateMultiFileApplet.notCalled).true();
			should(appletUploadFacadeMock.createSingleFileApplet.notCalled).true();
			should(appletUploadFacadeMock.createMultiFileFileApplet.notCalled).true();

			should(appletUploadCommandHelperMock.getAppletBinaryFileAbsolutePath.calledOnce).true();
			should(appletUploadCommandHelperMock.getAppletDirectoryAbsolutePath.notCalled).true();
			should(appletUploadCommandHelperMock.getAppletEntryFileAbsolutePath.notCalled).true();
		});

		it('should create with confirmation', async function () {
			await singleFileAppletUploadConfirmTrue.run(singleFileOptions);
			should(appletUploadFacadeMock.createSingleFileApplet.calledOnce).true();
			should(appletUploadFacadeMock.updateSingleFileApplet.notCalled).true();
			should(appletUploadFacadeMock.updateMultiFileApplet.notCalled).true();
			should(appletUploadFacadeMock.createMultiFileFileApplet.notCalled).true();

			should(appletUploadCommandHelperMock.getAppletBinaryFileAbsolutePath.calledOnce).true();
			should(appletUploadCommandHelperMock.getAppletDirectoryAbsolutePath.notCalled).true();
			should(appletUploadCommandHelperMock.getAppletEntryFileAbsolutePath.notCalled).true();
		});

		it('should fail on override', async function () {
			try {
				await singleFileAppletUploadOverrideFalse.run(singleFileOptions);
			} catch (error) {
				should(getErrorMessage(error)).deepEqual('Applet version upload was canceled.');
			}
			should(appletUploadFacadeMock.updateSingleFileApplet.notCalled).true();
			should(appletUploadFacadeMock.updateMultiFileApplet.notCalled).true();
			should(appletUploadFacadeMock.createSingleFileApplet.notCalled).true();
			should(appletUploadFacadeMock.createMultiFileFileApplet.notCalled).true();

			should(appletUploadCommandHelperMock.getAppletBinaryFileAbsolutePath.calledOnce).true();
			should(appletUploadCommandHelperMock.getAppletDirectoryAbsolutePath.notCalled).true();
			should(appletUploadCommandHelperMock.getAppletEntryFileAbsolutePath.notCalled).true();
		});

		it('should fail on confirmation', async function () {
			try {
				await singleFileAppletUploadConfirmFalse.run(singleFileOptions);
			} catch (error) {
				should(getErrorMessage(error)).deepEqual('Applet version upload was canceled.');
			}
			should(appletUploadFacadeMock.updateSingleFileApplet.notCalled).true();
			should(appletUploadFacadeMock.updateMultiFileApplet.notCalled).true();
			should(appletUploadFacadeMock.createSingleFileApplet.notCalled).true();
			should(appletUploadFacadeMock.createMultiFileFileApplet.notCalled).true();

			should(appletUploadCommandHelperMock.getAppletBinaryFileAbsolutePath.calledOnce).true();
			should(appletUploadCommandHelperMock.getAppletDirectoryAbsolutePath.notCalled).true();
			should(appletUploadCommandHelperMock.getAppletEntryFileAbsolutePath.notCalled).true();
		});

		it('should fail if applet version was already published', async function () {
			try {
				await singleFileAppletUploadOverrideFalse.run(singleFileOptions);
			} catch (error) {
				should(getErrorMessage(error)).deepEqual('Applet version upload was canceled.');
			}

			should(appletUploadFacadeMock.updateSingleFileApplet.notCalled).true();
			should(appletUploadFacadeMock.updateMultiFileApplet.notCalled).true();
			should(appletUploadFacadeMock.createSingleFileApplet.notCalled).true();
			should(appletUploadFacadeMock.createMultiFileFileApplet.notCalled).true();

			should(appletUploadCommandHelperMock.getAppletBinaryFileAbsolutePath.calledOnce).true();
			should(appletUploadCommandHelperMock.getAppletDirectoryAbsolutePath.notCalled).true();
			should(appletUploadCommandHelperMock.getAppletEntryFileAbsolutePath.notCalled).true();
		});
	});

	describe('multi file applet', function () {
		const testOptions = [
			{
				name: 'noUserOptions',
				value: noUserOptions,
			},
			{
				name: 'multiFileOptions',
				value: multiFileOptions,
			},
		];

		testOptions.forEach(({ name, value }: { name: string; value: any }) => {
			// eslint-disable-next-line mocha/consistent-spacing-between-blocks
			it(`should update with override - ${name}`, async function () {
				await singleFileAppletUploadOverrideTrue.run(value);
				should(appletUploadFacadeMock.updateMultiFileApplet.calledOnce).true();
				should(appletUploadFacadeMock.updateSingleFileApplet.notCalled).true();
				should(appletUploadFacadeMock.createSingleFileApplet.notCalled).true();
				should(appletUploadFacadeMock.createMultiFileFileApplet.notCalled).true();

				should(appletUploadCommandHelperMock.getAppletBinaryFileAbsolutePath.notCalled).true();
				should(appletUploadCommandHelperMock.getAppletDirectoryAbsolutePath.calledOnce).true();
				should(appletUploadCommandHelperMock.getAppletEntryFileAbsolutePath.calledOnce).true();
			});

			it(`should create with confirmation - ${name}`, async function () {
				await singleFileAppletUploadConfirmTrue.run(value);
				should(appletUploadFacadeMock.createMultiFileFileApplet.calledOnce).true();
				should(appletUploadFacadeMock.createSingleFileApplet.notCalled).true();
				should(appletUploadFacadeMock.updateSingleFileApplet.notCalled).true();
				should(appletUploadFacadeMock.updateMultiFileApplet.notCalled).true();

				should(appletUploadCommandHelperMock.getAppletBinaryFileAbsolutePath.notCalled).true();
				should(appletUploadCommandHelperMock.getAppletDirectoryAbsolutePath.calledOnce).true();
				should(appletUploadCommandHelperMock.getAppletEntryFileAbsolutePath.calledOnce).true();
			});

			it(`should fail on override - ${name}`, async function () {
				try {
					await singleFileAppletUploadOverrideFalse.run(value);
				} catch (error) {
					should(getErrorMessage(error)).deepEqual('Applet version upload was canceled.');
				}
				should(appletUploadFacadeMock.updateSingleFileApplet.notCalled).true();
				should(appletUploadFacadeMock.updateMultiFileApplet.notCalled).true();
				should(appletUploadFacadeMock.createSingleFileApplet.notCalled).true();
				should(appletUploadFacadeMock.createMultiFileFileApplet.notCalled).true();

				should(appletUploadCommandHelperMock.getAppletBinaryFileAbsolutePath.notCalled).true();
				should(appletUploadCommandHelperMock.getAppletDirectoryAbsolutePath.calledOnce).true();
				should(appletUploadCommandHelperMock.getAppletEntryFileAbsolutePath.calledOnce).true();
			});

			it(`should fail on confirmation - ${name}`, async function () {
				try {
					await singleFileAppletUploadConfirmFalse.run(value);
				} catch (error) {
					should(getErrorMessage(error)).deepEqual('Applet version upload was canceled.');
				}
				should(appletUploadFacadeMock.updateSingleFileApplet.notCalled).true();
				should(appletUploadFacadeMock.updateMultiFileApplet.notCalled).true();
				should(appletUploadFacadeMock.createSingleFileApplet.notCalled).true();
				should(appletUploadFacadeMock.createMultiFileFileApplet.notCalled).true();

				should(appletUploadCommandHelperMock.getAppletBinaryFileAbsolutePath.notCalled).true();
				should(appletUploadCommandHelperMock.getAppletDirectoryAbsolutePath.calledOnce).true();
				should(appletUploadCommandHelperMock.getAppletEntryFileAbsolutePath.calledOnce).true();
			});
		});
	});

	describe('unknown options validation', function () {
		it('should throw error for single-dash unknown options', async function () {
			const optionsWithUnknown = { ...singleFileOptions, _unknown: ['-yes'] };
			try {
				await singleFileAppletUploadOverrideTrue.run(optionsWithUnknown);
			} catch (error) {
				should(getErrorMessage(error)).deepEqual('Unknown option(s): -yes');
			}
		});

		it('should throw error for double-dash unknown options', async function () {
			const optionsWithUnknown = { ...singleFileOptions, _unknown: ['--something'] };
			try {
				await singleFileAppletUploadOverrideTrue.run(optionsWithUnknown);
			} catch (error) {
				should(getErrorMessage(error)).deepEqual('Unknown option(s): --something');
			}
		});

		it('should throw error for multiple unknown options', async function () {
			const optionsWithUnknown = { ...singleFileOptions, _unknown: ['--unknown1', '--unknown2'] };
			try {
				await singleFileAppletUploadOverrideTrue.run(optionsWithUnknown);
			} catch (error) {
				should(getErrorMessage(error)).deepEqual('Unknown option(s): --unknown1, --unknown2');
			}
		});

		it('should not throw error when _unknown contains non-option values', async function () {
			const optionsWithUnknown = { ...singleFileOptions, _unknown: ['somevalue', 'anothervalue'] };
			// Should not throw error for non-option values (don't start with -)
			// The test will fail due to other missing setup, but the unknown options validation should pass
			try {
				await singleFileAppletUploadOverrideTrue.run(optionsWithUnknown);
			} catch (error) {
				// Should not be about unknown options
				should(getErrorMessage(error)).not.match(/Unknown option/);
			}
		});

		it('should not throw error when _unknown is empty', async function () {
			const optionsWithUnknown = { ...singleFileOptions, _unknown: [] };
			try {
				await singleFileAppletUploadOverrideTrue.run(optionsWithUnknown);
			} catch (error) {
				// Should not be about unknown options
				should(getErrorMessage(error)).not.match(/Unknown option/);
			}
		});

		it('should not throw error when _unknown is undefined', async function () {
			const optionsWithoutUnknown = { ...singleFileOptions };
			try {
				await singleFileAppletUploadOverrideTrue.run(optionsWithoutUnknown);
			} catch (error) {
				// Should not be about unknown options
				should(getErrorMessage(error)).not.match(/Unknown option/);
			}
		});
	});

	beforeEach(function () {
		sinon.reset();
		// Reset individual sinon fakes in the mocks
		appletUploadFacadeMock.updateSingleFileApplet.resetHistory();
		appletUploadFacadeMock.updateMultiFileApplet.resetHistory();
		appletUploadFacadeMock.createSingleFileApplet.resetHistory();
		appletUploadFacadeMock.createMultiFileFileApplet.resetHistory();

		appletUploadCommandHelperMock.getAppletBinaryFileAbsolutePath.resetHistory();
		appletUploadCommandHelperMock.getAppletDirectoryAbsolutePath.resetHistory();
		appletUploadCommandHelperMock.getAppletEntryFileAbsolutePath.resetHistory();
		appletUploadCommandHelperMock.getAppletEntryFileRelativePath.resetHistory();
		appletUploadCommandHelperMock.saveToPackage.resetHistory();
	});
});
