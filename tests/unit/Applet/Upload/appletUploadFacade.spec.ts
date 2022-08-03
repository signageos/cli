import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as should from 'should';
import * as sinon from 'sinon';
import { updateMultiFileApplet } from '../../../../src/Applet/Upload/appletUploadFacade';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import NotFoundError from '@signageos/sdk/dist/RestApi/Error/NotFoundError';
import IAppletVersion from '@signageos/sdk/dist/RestApi/Applet/Version/IAppletVersion';

function makeTempDir() {
	const prefix = path.join(os.tmpdir(), 'appletUploadFacadeSpec-');
	return fs.mkdtemp(prefix);
}

describe('Applet.Upload.appletUploadFacade', () => {

	describe('updateMultiFileApplet', async () => {

		it('should update multi file applet, upload new files and remove old files', async () => {
			const tmpDir = await makeTempDir();
			try {
				const newFile1 = path.join(tmpDir, 'newFile1.txt');
				const newFile2 = path.join(tmpDir, 'newFile2.txt');

				await fs.writeFile(newFile1, 'new file 1');
				await fs.writeFile(newFile2, 'new file 2');

				const mockRestApi = {
					applet: {
						version: {
							update: sinon.stub().resolves(),
							async get(uid: string, version: string) {
								return {
									appletUid: uid,
									version,
									entryFile: 'index.html',
								} as IAppletVersion;
							},
							file: {
								async list(uid: string, version: string) {
									if (uid === 'test1' && version === '1.0.0') {
										return [
											{ path: 'oldFile1.txt' },
											{ path: 'oldFile2.txt' },
										];
									}
								},
								update: sinon.stub().resolves(),
								remove: sinon.stub().resolves(),
							},
						},
					},
				};

				await updateMultiFileApplet({
					restApi: mockRestApi as unknown as RestApi,
					applet: {
						uid: 'test1',
						version: '1.0.0',
						entryFilePath: 'index.html',
						directoryPath: tmpDir,
						files: [newFile1, newFile2],
					},
				});

				should(mockRestApi.applet.version.update.callCount).equal(1);
				should(mockRestApi.applet.version.update.getCall(0).args).deepEqual([
					'test1',
					'1.0.0',
					{
						entryFile: 'index.html',
					},
				]);

				should(mockRestApi.applet.version.file.update.callCount).equal(2);

				const fileUpdateFirstCallArgs = mockRestApi.applet.version.file.update.getCall(0).args;
				should(fileUpdateFirstCallArgs[0]).equal('test1');
				should(fileUpdateFirstCallArgs[1]).equal('1.0.0');
				should(fileUpdateFirstCallArgs[2]).equal('newFile1.txt');
				should(fileUpdateFirstCallArgs[3].content).instanceOf(fs.ReadStream);
				should(fileUpdateFirstCallArgs[3].hash).equal('1vwgbAV9J16slyAIMpq/vA==');
				should(fileUpdateFirstCallArgs[3].size).equal(10);
				should(fileUpdateFirstCallArgs[3].type).equal('text/plain');

				const fileUpdateSecondCallArgs = mockRestApi.applet.version.file.update.getCall(1).args;
				should(fileUpdateSecondCallArgs[0]).equal('test1');
				should(fileUpdateSecondCallArgs[1]).equal('1.0.0');
				should(fileUpdateSecondCallArgs[2]).equal('newFile2.txt');
				should(fileUpdateSecondCallArgs[3].content).instanceOf(fs.ReadStream);
				should(fileUpdateSecondCallArgs[3].hash).equal('6t6gOLnZSkLSl5czppfKug==');
				should(fileUpdateSecondCallArgs[3].size).equal(10);
				should(fileUpdateSecondCallArgs[3].type).equal('text/plain');

				should(mockRestApi.applet.version.file.remove.callCount).equal(2);
				should(mockRestApi.applet.version.file.remove.getCall(0).args).deepEqual(['test1', '1.0.0', 'oldFile1.txt', { build: false }]);
				should(mockRestApi.applet.version.file.remove.getCall(1).args).deepEqual(['test1', '1.0.0', 'oldFile2.txt', { build: false }]);
			} finally {
				await fs.remove(tmpDir);
			}
		});

		it('should update multi file applet and overwrite old file with new file', async () => {
			const tmpDir = await makeTempDir();
			try {
				const file1 = path.join(tmpDir, 'file1.txt');
				const file2 = path.join(tmpDir, 'file2.txt');

				await fs.writeFile(file1, 'new file 1');
				await fs.writeFile(file2, 'new file 2');

				const mockRestApi = {
					applet: {
						version: {
							update: sinon.stub().resolves(),
							async get(uid: string, version: string) {
								return {
									appletUid: uid,
									version,
									entryFile: 'index.html',
								} as IAppletVersion;
							},
							file: {
								async list(uid: string, version: string) {
									if (uid === 'test1' && version === '1.0.0') {
										return [
											{ path: 'file1.txt', hash: 'rBbIaPCdjijQ6pia8/+HvQ==', type: 'text/plain' },
											{ path: 'file2.txt', hash: 'gM8xgBx343vsB9udhJNRXw==', type: 'text/plain' },
										];
									}
								},
								update: sinon.stub().resolves(),
								remove: sinon.stub().resolves(),
							},
						},
					},
				};

				await updateMultiFileApplet({
					restApi: mockRestApi as unknown as RestApi,
					applet: {
						uid: 'test1',
						version: '1.0.0',
						entryFilePath: 'index.html',
						directoryPath: tmpDir,
						files: [file1, file2],
					},
				});

				should(mockRestApi.applet.version.update.callCount).equal(1);
				should(mockRestApi.applet.version.update.getCall(0).args).deepEqual([
					'test1',
					'1.0.0',
					{
						entryFile: 'index.html',
					},
				]);

				should(mockRestApi.applet.version.file.update.callCount).equal(2);

				const fileUpdateFirstCallArgs = mockRestApi.applet.version.file.update.getCall(0).args;
				should(fileUpdateFirstCallArgs[0]).equal('test1');
				should(fileUpdateFirstCallArgs[1]).equal('1.0.0');
				should(fileUpdateFirstCallArgs[2]).equal('file1.txt');
				should(fileUpdateFirstCallArgs[3].content).instanceOf(fs.ReadStream);
				should(fileUpdateFirstCallArgs[3].hash).equal('1vwgbAV9J16slyAIMpq/vA==');
				should(fileUpdateFirstCallArgs[3].size).equal(10);
				should(fileUpdateFirstCallArgs[3].type).equal('text/plain');

				const fileUpdateSecondCallArgs = mockRestApi.applet.version.file.update.getCall(1).args;
				should(fileUpdateSecondCallArgs[0]).equal('test1');
				should(fileUpdateSecondCallArgs[1]).equal('1.0.0');
				should(fileUpdateSecondCallArgs[2]).equal('file2.txt');
				should(fileUpdateSecondCallArgs[3].content).instanceOf(fs.ReadStream);
				should(fileUpdateSecondCallArgs[3].hash).equal('6t6gOLnZSkLSl5czppfKug==');
				should(fileUpdateSecondCallArgs[3].size).equal(10);
				should(fileUpdateSecondCallArgs[3].type).equal('text/plain');

				should(mockRestApi.applet.version.file.remove.callCount).equal(0);
			} finally {
				await fs.remove(tmpDir);
			}
		});

		it('should not update multi file applet and ignore uploading files that didn\'t change', async () => {
			const tmpDir = await makeTempDir();
			try {
				const file1 = path.join(tmpDir, 'file1.txt');
				await fs.writeFile(file1, 'new file 1');

				const mockRestApi = {
					applet: {
						version: {
							update: sinon.stub().resolves(),
							async get(uid: string, version: string) {
								return {
									appletUid: uid,
									version,
									entryFile: 'index.html',
								} as IAppletVersion;
							},
							file: {
								async list(uid: string, version: string) {
									if (uid === 'test1' && version === '1.0.0') {
										return [
											{ path: 'file1.txt', hash: '1vwgbAV9J16slyAIMpq/vA==', type: 'text/plain' },
										];
									}
								},
								update: sinon.stub().resolves(),
								remove: sinon.stub().resolves(),
							},
						},
					},
				};

				await updateMultiFileApplet({
					restApi: mockRestApi as unknown as RestApi,
					applet: {
						uid: 'test1',
						version: '1.0.0',
						entryFilePath: 'index.html',
						directoryPath: tmpDir,
						files: [file1],
					},
				});

				should(mockRestApi.applet.version.update.callCount).equal(0);
				should(mockRestApi.applet.version.file.update.callCount).equal(0);
				should(mockRestApi.applet.version.file.remove.callCount).equal(0);
			} finally {
				await fs.remove(tmpDir);
			}
		});

		it('should ignore when remove old file fails with NotFoundError and resolve anyway', async () => {
			const tmpDir = await makeTempDir();
			try {
				const newFile1 = path.join(tmpDir, 'newFile1.txt');
				await fs.writeFile(newFile1, 'new file 1');

				const mockRestApi = {
					applet: {
						version: {
							update: sinon.stub().resolves(),
							async get(uid: string, version: string) {
								return {
									appletUid: uid,
									version,
									entryFile: 'index.html',
								} as IAppletVersion;
							},
							file: {
								async list(uid: string, version: string) {
									if (uid === 'test1' && version === '1.0.0') {
										return [
											{ path: 'oldFile1.txt', hash: '1vwgbAV9J16slyAIMpq/vA==', type: 'text/plain' },
										];
									}
								},
								update: sinon.stub().resolves(),
								remove: sinon.stub().rejects(new NotFoundError(404, 'fail')),
							},
						},
					},
				};

				await updateMultiFileApplet({
					restApi: mockRestApi as unknown as RestApi,
					applet: {
						uid: 'test1',
						version: '1.0.0',
						entryFilePath: 'index.html',
						directoryPath: tmpDir,
						files: [newFile1],
					},
				});

				should(mockRestApi.applet.version.file.remove.callCount).equal(1);
			} finally {
				await fs.remove(tmpDir);
			}
		});

		it('should reject if remove old file rejects with any other error than NotFoundError', async () => {
			const tmpDir = await makeTempDir();
			try {
				const newFile1 = path.join(tmpDir, 'newFile1.txt');
				await fs.writeFile(newFile1, 'new file 1');

				const mockRestApi = {
					applet: {
						version: {
							update: sinon.stub().resolves(),
							async get(uid: string, version: string) {
								return {
									appletUid: uid,
									version,
									entryFile: 'index.html',
								} as IAppletVersion;
							},
							file: {
								async list(uid: string, version: string) {
									if (uid === 'test1' && version === '1.0.0') {
										return [
											{ path: 'oldFile1.txt', hash: '1vwgbAV9J16slyAIMpq/vA==', type: 'text/plain' },
										];
									}
								},
								update: sinon.stub().resolves(),
								remove: sinon.stub().rejects(new Error('unexpected fail')),
							},
						},
					},
				};

				await should(
					updateMultiFileApplet({
						restApi: mockRestApi as unknown as RestApi,
						applet: {
							uid: 'test1',
							version: '1.0.0',
							entryFilePath: 'index.html',
							directoryPath: tmpDir,
							files: [newFile1],
						},
					}),
				).be.rejected();

				should(mockRestApi.applet.version.file.remove.callCount).equal(1);
			} finally {
				await fs.remove(tmpDir);
			}
		});
	});
});
