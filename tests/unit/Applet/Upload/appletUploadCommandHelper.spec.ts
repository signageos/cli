import * as should from 'should';
import * as pathTool from 'path';
import rewireMock from 'rewiremock';

const EXISTING_RELATIVE_DIR_PATH = 'existingRelativeDirPath';
const EXISTING_RELATIVE_FILE_PATH = 'existingRelativeFilePath';
const EXISTING_ABSOLUTE_FILE_PATH = '/existingAbsoluteFilePath';
const EXISTING_ABSOLUTE_DIR_PATH = '/existingAbsoluteDirPath';

const fsMock = {
	pathExists: (path: string) => {
		switch (path) {
			case '/' + EXISTING_RELATIVE_DIR_PATH:
			case '/' + EXISTING_RELATIVE_FILE_PATH:
			case EXISTING_ABSOLUTE_FILE_PATH:
			case EXISTING_ABSOLUTE_DIR_PATH:
			case '/' + DEFAULT_APPLET_BINARY_FILE_PATH:
			case '/' + DEFAULT_APPLET_ENTRY_FILE_PATH:
			case pathTool.join('/', DEFAULT_APPLET_DIR_PATH):
				return true;
			default:
				return false;
		}
	},
	stat: (path: string) => {
		return Promise.resolve({
			isDirectory: () => {
				switch (path) {
					case '/' + EXISTING_RELATIVE_DIR_PATH:
					case EXISTING_ABSOLUTE_DIR_PATH:
					case pathTool.join('/', DEFAULT_APPLET_DIR_PATH):
						return true;
					default:
						return false;
				}
			},
			isFile: () => {
				switch (path) {
					case '/' + EXISTING_RELATIVE_FILE_PATH:
					case EXISTING_ABSOLUTE_FILE_PATH:
					case '/' + DEFAULT_APPLET_BINARY_FILE_PATH:
					case '/' + DEFAULT_APPLET_ENTRY_FILE_PATH:
						return true;
					default:
						return false;
				}
			},
		});
	},
};

rewireMock('fs-extra').with(fsMock);
rewireMock.enable();
import {
	getAppletDirectoryAbsolutePath,
	getAppletBinaryFileAbsolutePath,
	getAppletEntryFileAbsolutePath,
	getAppletEntryFileRelativePath,
	DEFAULT_APPLET_BINARY_FILE_PATH,
	DEFAULT_APPLET_ENTRY_FILE_PATH,
	DEFAULT_APPLET_DIR_PATH,
} from '../../../../src/Applet/Upload/appletUploadCommandHelper';
import { generalOptions } from '../../helperMock';
rewireMock.disable();

describe('unit.appletUploadCommandHelper', () => {

	describe('getAppletDirectoryAbsolutePath', () => {

		it('should use default applet directory', async () => {
			const actualAbsolutePath = await getAppletDirectoryAbsolutePath(
				'/',
				{
					...generalOptions,
					'applet-path': DEFAULT_APPLET_DIR_PATH,
				},
			);

			should.deepEqual(actualAbsolutePath, pathTool.join('/', DEFAULT_APPLET_DIR_PATH));
		});

		it('should not change absolute path', async () => {
			const actualAbsolutePath = await getAppletDirectoryAbsolutePath(
				'/whatever',
				{
					...generalOptions,
					'applet-path': EXISTING_ABSOLUTE_DIR_PATH,
				},
			);

			should.deepEqual(actualAbsolutePath, EXISTING_ABSOLUTE_DIR_PATH);
		});

		it('should change relative path to absolute', async () => {
			const actualAbsolutePath = await getAppletDirectoryAbsolutePath(
				'/',
				{
					...generalOptions,
					'applet-path': EXISTING_RELATIVE_DIR_PATH,
				},
			);

			should.deepEqual(actualAbsolutePath, '/' + EXISTING_RELATIVE_DIR_PATH);
		});

		it('should remove trailing slash - relative path', async () => {
			const actualAbsolutePath = await getAppletDirectoryAbsolutePath(
				'/',
				{
					...generalOptions,
					'applet-path': EXISTING_RELATIVE_DIR_PATH + '/',
				},
			);

			should.deepEqual(actualAbsolutePath, '/' + EXISTING_RELATIVE_DIR_PATH);
		});

		it('should remove trailing slash - absolute path', async () => {
			const actualAbsolutePath = await getAppletDirectoryAbsolutePath(
				'/',
				{
					...generalOptions,
					'applet-path': EXISTING_ABSOLUTE_DIR_PATH + '/',
				},
			);

			should.deepEqual(actualAbsolutePath, EXISTING_ABSOLUTE_DIR_PATH);
		});

		it('should fail if the absolute path does not exist', async () => {
			let failed = false;
			try {
				await getAppletDirectoryAbsolutePath(
					'/whatever',
					{
						...generalOptions,
						'applet-path': '/nonExistingAbsolutePath',
					},
				);
			} catch (error) {
				failed = true;
			}

			should.deepEqual(failed, true);
		});

		it('should fail if the absolute path is not a directory', async () => {
			let failed = false;
			try {
				await getAppletDirectoryAbsolutePath(
					'/whatever',
					{
						...generalOptions,
						'applet-path': EXISTING_ABSOLUTE_FILE_PATH,
					},
				);
			} catch (error) {
				failed = true;
			}

			should.deepEqual(failed, true);
		});

		it('should fail if the relative path is not a directory', async () => {
			let failed = false;
			try {
				await getAppletDirectoryAbsolutePath(
					'/',
					{
						...generalOptions,
						'applet-path': EXISTING_RELATIVE_FILE_PATH,
					},
				);
			} catch (error) {
				failed = true;
			}

			should.deepEqual(failed, true);
		});
	});

	describe('getAppletBinaryFileAbsolutePath', () => {

		it('should use default applet binary file', async () => {
			const actualAbsolutePath = await getAppletBinaryFileAbsolutePath(
				'/',
				{
					...generalOptions,
					'applet-path': DEFAULT_APPLET_BINARY_FILE_PATH,
				},
			);

			should.deepEqual(actualAbsolutePath, '/' + DEFAULT_APPLET_BINARY_FILE_PATH);
		});

		it('should not change absolute path', async () => {
			const actualAbsolutePath = await getAppletBinaryFileAbsolutePath(
				'/whatever',
				{
					...generalOptions,
					'applet-path': EXISTING_ABSOLUTE_FILE_PATH,
				},
			);

			should.deepEqual(actualAbsolutePath, EXISTING_ABSOLUTE_FILE_PATH);
		});

		it('should change relative path to absolute', async () => {
			const actualAbsolutePath = await getAppletBinaryFileAbsolutePath(
				'/',
				{
					...generalOptions,
					'applet-path': EXISTING_RELATIVE_FILE_PATH,
				},
			);

			should.deepEqual(actualAbsolutePath, '/' + EXISTING_RELATIVE_FILE_PATH);
		});

		it('should fail if the absolute path does not exist', async () => {
			let failed = false;
			try {
				await getAppletBinaryFileAbsolutePath(
					'/whatever',
					{
						...generalOptions,
						'applet-path': '/nonExistingAbsolutePath',
					},
				);
			} catch (error) {
				failed = true;
			}

			should.deepEqual(failed, true);
		});

		it('should fail if the absolute path is not a file', async () => {
			let failed = false;
			try {
				await getAppletBinaryFileAbsolutePath(
					'/whatever',
					{
						...generalOptions,
						'applet-path': EXISTING_ABSOLUTE_DIR_PATH,
					},
				);
			} catch (error) {
				failed = true;
			}

			should.deepEqual(failed, true);
		});

		it('should fail if the relative path is not a file', async () => {
			let failed = false;
			try {
				await getAppletBinaryFileAbsolutePath(
					'/',
					{
						...generalOptions,
						'applet-path': EXISTING_RELATIVE_DIR_PATH,
					},
				);
			} catch (error) {
				failed = true;
			}

			should.deepEqual(failed, true);
		});
	});

	describe('getAppletEntryFileAbsolutePath', () => {

		it('should use default applet binary file', async () => {
			const actualAbsolutePath = await getAppletEntryFileAbsolutePath(
				'/',
				{
					...generalOptions,
					'entry-file-path': DEFAULT_APPLET_ENTRY_FILE_PATH,
				},
			);

			should.deepEqual(actualAbsolutePath, '/' + DEFAULT_APPLET_BINARY_FILE_PATH);
		});

		it('should not change absolute path', async () => {
			const actualAbsolutePath = await getAppletEntryFileAbsolutePath(
				'/whatever',
				{
					...generalOptions,
					'entry-file-path': EXISTING_ABSOLUTE_FILE_PATH,
				},
			);

			should.deepEqual(actualAbsolutePath, EXISTING_ABSOLUTE_FILE_PATH);
		});

		it('should change relative path to absolute', async () => {
			const actualAbsolutePath = await getAppletEntryFileAbsolutePath(
				'/',
				{
					...generalOptions,
					'entry-file-path': EXISTING_RELATIVE_FILE_PATH,
				},
			);

			should.deepEqual(actualAbsolutePath, '/' + EXISTING_RELATIVE_FILE_PATH);
		});

		it('should fail if the absolute path does not exist', async () => {
			let failed = false;
			try {
				await getAppletEntryFileAbsolutePath(
					'/whatever',
					{
						...generalOptions,
						'entry-file-path': '/nonExistingAbsolutePath',
					},
				);
			} catch (error) {
				failed = true;
			}

			should.deepEqual(failed, true);
		});

		it('should fail if the absolute path is not a file', async () => {
			let failed = false;
			try {
				await getAppletEntryFileAbsolutePath(
					'/whatever',
					{
						...generalOptions,
						'entry-file-path': EXISTING_ABSOLUTE_DIR_PATH,
					},
				);
			} catch (error) {
				failed = true;
			}

			should.deepEqual(failed, true);
		});

		it('should fail if the relative path is not a file', async () => {
			let failed = false;
			try {
				await getAppletEntryFileAbsolutePath(
					'/',
					{
						...generalOptions,
						'entry-file-path': EXISTING_RELATIVE_DIR_PATH,
					},
				);
			} catch (error) {
				failed = true;
			}

			should.deepEqual(failed, true);
		});
	});

	describe('getAppletEntryFileRelativePath', () => {

		it('should return relative path - sub folder', async () => {
			const actualRelativePath = getAppletEntryFileRelativePath(
				'/applet/src/index.js',
				'/applet',
			);

			should.deepEqual(actualRelativePath, 'src/index.js');
		});

		it('should return relative path - the same folder', async () => {
			const actualRelativePath = getAppletEntryFileRelativePath(
				'/applet/index.js',
				'/applet',
			);

			should.deepEqual(actualRelativePath, 'index.js');
		});

		it('should fail - different folders', async () => {
			let failed = false;
			try {
				getAppletEntryFileRelativePath(
					'/applet/index.js',
					'/src',
				);
			} catch (error) {
				failed = true;
			}

			should.deepEqual(failed, true);
		});

		it('should fail - more inner folder', async () => {
			let failed = false;
			try {
				getAppletEntryFileRelativePath(
					'/applet/index.js',
					'/applet/src',
				);
			} catch (error) {
				failed = true;
			}

			should.deepEqual(failed, true);
		});
	});
});
