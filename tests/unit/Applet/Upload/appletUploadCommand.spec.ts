import * as should from 'should';
import * as sinon from 'sinon';
import rewireMock from 'rewiremock';
import appletFacadeMock from '../appletFacadeMock';
import appletUploadFacadeMock from './appletUploadFacadeMock';
import appletUploadCommandHelperMock from './appletUploadCommandHelperMock';
import organizationFacadeMock from '../../Organization/organizationFacadeMock';
import fileSystemHelperMock from '../../FileSystem/helperMock';
import helperMock, { restApiWithNonExistingAppletVersion } from '../../helperMock';
import { promptsMockFactory } from '../../promptsMock';
import { singleFileOptions, multiFileOptions, noUserOptions } from './appletUploadCommandOptionsMock';

const promptsMockOverrideTrue = promptsMockFactory([
	{ questionName: 'override', answer: true},
]);
const promptsMockOverrideFalse = promptsMockFactory([
	{ questionName: 'override', answer: false},
]);
const promptsMockConfirmTrue = promptsMockFactory([
	{ questionName: 'newVersion', answer: true},
]);
const promptsMockConfirmFalse = promptsMockFactory([
	{ questionName: 'newVersion', answer: false},
]);

rewireMock('../appletFacade').with(appletFacadeMock);
rewireMock('./appletUploadFacade').with(appletUploadFacadeMock);
rewireMock('./appletUploadCommandHelper').with(appletUploadCommandHelperMock);
rewireMock('../../Organization/organizationFacade').with(organizationFacadeMock);
rewireMock('../../FileSystem/helper').with(fileSystemHelperMock);
rewireMock.enable();
rewireMock('../../helper').with(helperMock);
rewireMock('prompts').with(promptsMockOverrideTrue);
import { appletUpload as singleFileAppletUploadOverrideTrue } from '../../../../src/Applet/Upload/appletUploadCommand';
rewireMock('../../helper').with(helperMock);
rewireMock('prompts').with(promptsMockOverrideFalse);
import { appletUpload as singleFileAppletUploadOverrideFalse } from '../../../../src/Applet/Upload/appletUploadCommand';
rewireMock('../../helper').with(restApiWithNonExistingAppletVersion);
rewireMock('prompts').with(promptsMockConfirmTrue);
import { appletUpload as singleFileAppletUploadConfirmTrue } from '../../../../src/Applet/Upload/appletUploadCommand';
rewireMock('../../helper').with(restApiWithNonExistingAppletVersion);
rewireMock('prompts').with(promptsMockConfirmFalse);
import { appletUpload as singleFileAppletUploadConfirmFalse } from '../../../../src/Applet/Upload/appletUploadCommand';
rewireMock.disable();

describe('unit.appletUploadCommand', () => {

	describe('single file applet', () => {

		it('should update with override', async () => {
			await singleFileAppletUploadOverrideTrue.run(singleFileOptions);
			should(appletUploadFacadeMock.updateSingleFileApplet.calledOnce).true();
			should(appletUploadFacadeMock.updateMultiFileApplet.notCalled).true();
			should(appletUploadFacadeMock.createSingleFileApplet.notCalled).true();
			should(appletUploadFacadeMock.createMultiFileFileApplet.notCalled).true();

			should(appletUploadCommandHelperMock.getAppletBinaryFileAbsolutePath.calledOnce).true();
			should(appletUploadCommandHelperMock.getAppletDirectoryAbsolutePath.notCalled).true();
			should(appletUploadCommandHelperMock.getAppletEntryFileAbsolutePath.notCalled).true();
		});

		it('should create with confirmation', async () => {
			await singleFileAppletUploadConfirmTrue.run(singleFileOptions);
			should(appletUploadFacadeMock.createSingleFileApplet.calledOnce).true();
			should(appletUploadFacadeMock.updateSingleFileApplet.notCalled).true();
			should(appletUploadFacadeMock.updateMultiFileApplet.notCalled).true();
			should(appletUploadFacadeMock.createMultiFileFileApplet.notCalled).true();

			should(appletUploadCommandHelperMock.getAppletBinaryFileAbsolutePath.calledOnce).true();
			should(appletUploadCommandHelperMock.getAppletDirectoryAbsolutePath.notCalled).true();
			should(appletUploadCommandHelperMock.getAppletEntryFileAbsolutePath.notCalled).true();
		});

		it('should fail on override', async () => {
			try {
				await singleFileAppletUploadOverrideFalse.run(singleFileOptions);
			} catch (error) {
				should(error.message).deepEqual('Applet version upload was canceled.');
			}
			should(appletUploadFacadeMock.updateSingleFileApplet.notCalled).true();
			should(appletUploadFacadeMock.updateMultiFileApplet.notCalled).true();
			should(appletUploadFacadeMock.createSingleFileApplet.notCalled).true();
			should(appletUploadFacadeMock.createMultiFileFileApplet.notCalled).true();

			should(appletUploadCommandHelperMock.getAppletBinaryFileAbsolutePath.calledOnce).true();
			should(appletUploadCommandHelperMock.getAppletDirectoryAbsolutePath.notCalled).true();
			should(appletUploadCommandHelperMock.getAppletEntryFileAbsolutePath.notCalled).true();
		});

		it('should fail on confirmation', async () => {
			try {
				await singleFileAppletUploadConfirmFalse.run(singleFileOptions);
			} catch (error) {
				should(error.message).deepEqual('Applet version upload was canceled.');
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

	describe('multi file applet', () => {

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

		testOptions.forEach(({ name, value }: { name: string, value: any }) => {
			it(`should update with override - ${name}`, async () => {
				await singleFileAppletUploadOverrideTrue.run(value);
				should(appletUploadFacadeMock.updateMultiFileApplet.calledOnce).true();
				should(appletUploadFacadeMock.updateSingleFileApplet.notCalled).true();
				should(appletUploadFacadeMock.createSingleFileApplet.notCalled).true();
				should(appletUploadFacadeMock.createMultiFileFileApplet.notCalled).true();

				should(appletUploadCommandHelperMock.getAppletBinaryFileAbsolutePath.notCalled).true();
				should(appletUploadCommandHelperMock.getAppletDirectoryAbsolutePath.calledOnce).true();
				should(appletUploadCommandHelperMock.getAppletEntryFileAbsolutePath.calledOnce).true();
			});

			it(`should create with confirmation - ${name}`, async () => {
				await singleFileAppletUploadConfirmTrue.run(value);
				should(appletUploadFacadeMock.createMultiFileFileApplet.calledOnce).true();
				should(appletUploadFacadeMock.createSingleFileApplet.notCalled).true();
				should(appletUploadFacadeMock.updateSingleFileApplet.notCalled).true();
				should(appletUploadFacadeMock.updateMultiFileApplet.notCalled).true();

				should(appletUploadCommandHelperMock.getAppletBinaryFileAbsolutePath.notCalled).true();
				should(appletUploadCommandHelperMock.getAppletDirectoryAbsolutePath.calledOnce).true();
				should(appletUploadCommandHelperMock.getAppletEntryFileAbsolutePath.calledOnce).true();
			});

			it(`should fail on override - ${name}`, async () => {
				try {
					await singleFileAppletUploadOverrideFalse.run(value);
				} catch (error) {
					should(error.message).deepEqual('Applet version upload was canceled.');
				}
				should(appletUploadFacadeMock.updateSingleFileApplet.notCalled).true();
				should(appletUploadFacadeMock.updateMultiFileApplet.notCalled).true();
				should(appletUploadFacadeMock.createSingleFileApplet.notCalled).true();
				should(appletUploadFacadeMock.createMultiFileFileApplet.notCalled).true();

				should(appletUploadCommandHelperMock.getAppletBinaryFileAbsolutePath.notCalled).true();
				should(appletUploadCommandHelperMock.getAppletDirectoryAbsolutePath.calledOnce).true();
				should(appletUploadCommandHelperMock.getAppletEntryFileAbsolutePath.calledOnce).true();
			});

			it(`should fail on confirmation - ${name}`, async () => {
				try {
					await singleFileAppletUploadConfirmFalse.run(value);
				} catch (error) {
					should(error.message).deepEqual('Applet version upload was canceled.');
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

	beforeEach(() => {
		sinon.reset();
	});
});
