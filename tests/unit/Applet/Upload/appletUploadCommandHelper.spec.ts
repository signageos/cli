import should from 'should';
import * as pathTool from 'path';
const rewireMock = require('rewiremock').default;

// Define path constants - platform neutral
const EXISTING_RELATIVE_DIR_PATH = 'existingRelativeDirPath';
const EXISTING_RELATIVE_FILE_PATH = 'existingRelativeFilePath';
const EXISTING_ABSOLUTE_FILE_PATH = '/existingAbsoluteFilePath';
const EXISTING_ABSOLUTE_DIR_PATH = '/existingAbsoluteDirPath';
const ROOT_DIR = '/';

// Define constants before they are used
const DEFAULT_APPLET_DIR_PATH = '.';
const DEFAULT_APPLET_ENTRY_FILE_PATH = 'dist/index.html';
const DEFAULT_APPLET_BINARY_FILE_PATH = 'dist/index.html';

const fsMock = {
	pathExists: (path: string) => {
		// Special case for root directory which may be normalized differently on different platforms
		if (path === '' || path === '.' || path === '/' || path === pathTool.normalize('/')) {
			return true;
		}

		const normalizedPath = pathTool.normalize(path);
		const validPaths = [
			pathTool.normalize(pathTool.join(ROOT_DIR, EXISTING_RELATIVE_DIR_PATH)),
			pathTool.normalize(pathTool.join(ROOT_DIR, EXISTING_RELATIVE_FILE_PATH)),
			pathTool.normalize(EXISTING_ABSOLUTE_FILE_PATH),
			pathTool.normalize(EXISTING_ABSOLUTE_DIR_PATH),
			pathTool.normalize(pathTool.join(ROOT_DIR, DEFAULT_APPLET_BINARY_FILE_PATH)),
			pathTool.normalize(pathTool.join(ROOT_DIR, DEFAULT_APPLET_ENTRY_FILE_PATH)),
			pathTool.normalize(pathTool.join(ROOT_DIR, DEFAULT_APPLET_DIR_PATH)),
			pathTool.normalize(ROOT_DIR), // Root directory
		];

		return validPaths.includes(normalizedPath);
	},
	stat: (path: string) => {
		// Special case for root directory which may be normalized differently on different platforms
		if (path === '' || path === '.' || path === '/' || path === pathTool.normalize('/')) {
			return Promise.resolve({
				isDirectory: () => true,
				isFile: () => false,
			});
		}

		const normalizedPath = pathTool.normalize(path);
		return Promise.resolve({
			isDirectory: () => {
				return [
					pathTool.normalize(pathTool.join(ROOT_DIR, EXISTING_RELATIVE_DIR_PATH)),
					pathTool.normalize(EXISTING_ABSOLUTE_DIR_PATH),
					pathTool.normalize(pathTool.join(ROOT_DIR, DEFAULT_APPLET_DIR_PATH)),
					pathTool.normalize(ROOT_DIR), // Root directory
				].some((validPath) => normalizedPath === validPath);
			},
			isFile: () => {
				return [
					pathTool.normalize(pathTool.join(ROOT_DIR, EXISTING_RELATIVE_FILE_PATH)),
					pathTool.normalize(EXISTING_ABSOLUTE_FILE_PATH),
					pathTool.normalize(pathTool.join(ROOT_DIR, DEFAULT_APPLET_BINARY_FILE_PATH)),
					pathTool.normalize(pathTool.join(ROOT_DIR, DEFAULT_APPLET_ENTRY_FILE_PATH)),
				].some((validPath) => normalizedPath === validPath);
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
} from '../../../../src/Applet/Upload/appletUploadCommandHelper';
import { generalOptions } from '../../helperMock';
rewireMock.disable();

describe('unit.appletUploadCommandHelper', function () {
	describe('getAppletDirectoryAbsolutePath', function () {
		it('should use default applet directory', async function () {
			const actualAbsolutePath = await getAppletDirectoryAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'applet-path': DEFAULT_APPLET_DIR_PATH,
			});

			// The implementation resolves "." to the current directory, not the root directory
			// This matches the intended behavior
			assertPathsEqual(actualAbsolutePath, ROOT_DIR);
		});

		it('should not change absolute path', async function () {
			const actualAbsolutePath = await getAppletDirectoryAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'applet-path': EXISTING_ABSOLUTE_DIR_PATH,
			});

			assertPathsEqual(actualAbsolutePath, EXISTING_ABSOLUTE_DIR_PATH);
		});

		it('should change relative path to absolute', async function () {
			const actualAbsolutePath = await getAppletDirectoryAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'applet-path': EXISTING_RELATIVE_DIR_PATH,
			});

			assertPathsEqual(actualAbsolutePath, pathTool.join(ROOT_DIR, EXISTING_RELATIVE_DIR_PATH));
		});

		it('should remove trailing slash - relative path', async function () {
			const actualAbsolutePath = await getAppletDirectoryAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'applet-path': EXISTING_RELATIVE_DIR_PATH + '/',
			});

			assertPathsEqual(actualAbsolutePath, pathTool.join(ROOT_DIR, EXISTING_RELATIVE_DIR_PATH));
		});

		it('should remove trailing slash - absolute path', async function () {
			const actualAbsolutePath = await getAppletDirectoryAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'applet-path': EXISTING_ABSOLUTE_DIR_PATH + '/',
			});

			assertPathsEqual(actualAbsolutePath, EXISTING_ABSOLUTE_DIR_PATH);
		});

		it('should fail if the absolute path does not exist', async function () {
			let failed = false;
			try {
				await getAppletDirectoryAbsolutePath(ROOT_DIR, {
					...generalOptions,
					'applet-path': pathTool.normalize('/nonExistingAbsolutePath'),
				});
			} catch {
				failed = true;
			}

			should.equal(failed, true);
		});

		it('should fail if the absolute path is not a directory', async function () {
			let failed = false;
			try {
				await getAppletDirectoryAbsolutePath(ROOT_DIR, {
					...generalOptions,
					'applet-path': EXISTING_ABSOLUTE_FILE_PATH,
				});
			} catch {
				failed = true;
			}

			should.equal(failed, true);
		});

		it('should fail if the relative path is not a directory', async function () {
			let failed = false;
			try {
				await getAppletDirectoryAbsolutePath(ROOT_DIR, {
					...generalOptions,
					'applet-path': EXISTING_RELATIVE_FILE_PATH,
				});
			} catch {
				failed = true;
			}

			should.equal(failed, true);
		});
	});

	describe('getAppletBinaryFileAbsolutePath', function () {
		it('should use default applet binary file', async function () {
			const actualAbsolutePath = await getAppletBinaryFileAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'applet-path': DEFAULT_APPLET_BINARY_FILE_PATH,
			});

			assertPathsEqual(actualAbsolutePath, pathTool.join(ROOT_DIR, DEFAULT_APPLET_BINARY_FILE_PATH));
		});

		it('should not change absolute path', async function () {
			const actualAbsolutePath = await getAppletBinaryFileAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'applet-path': EXISTING_ABSOLUTE_FILE_PATH,
			});

			assertPathsEqual(actualAbsolutePath, EXISTING_ABSOLUTE_FILE_PATH);
		});

		it('should change relative path to absolute', async function () {
			const actualAbsolutePath = await getAppletBinaryFileAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'applet-path': EXISTING_RELATIVE_FILE_PATH,
			});

			assertPathsEqual(actualAbsolutePath, pathTool.join(ROOT_DIR, EXISTING_RELATIVE_FILE_PATH));
		});

		it('should fail if the absolute path does not exist', async function () {
			let failed = false;
			try {
				await getAppletBinaryFileAbsolutePath(ROOT_DIR, {
					...generalOptions,
					'applet-path': pathTool.normalize('/nonExistingAbsolutePath'),
				});
			} catch {
				failed = true;
			}

			should.equal(failed, true);
		});

		it('should fail if the absolute path is not a file', async function () {
			let failed = false;
			try {
				await getAppletBinaryFileAbsolutePath(ROOT_DIR, {
					...generalOptions,
					'applet-path': EXISTING_ABSOLUTE_DIR_PATH,
				});
			} catch {
				failed = true;
			}

			should.equal(failed, true);
		});

		it('should fail if the relative path is not a file', async function () {
			let failed = false;
			try {
				await getAppletBinaryFileAbsolutePath(ROOT_DIR, {
					...generalOptions,
					'applet-path': EXISTING_RELATIVE_DIR_PATH,
				});
			} catch {
				failed = true;
			}

			should.equal(failed, true);
		});
	});

	describe('getAppletEntryFileAbsolutePath', function () {
		it('should use default applet binary file', async function () {
			const actualAbsolutePath = await getAppletEntryFileAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'entry-file-path': DEFAULT_APPLET_ENTRY_FILE_PATH,
			});

			assertPathsEqual(actualAbsolutePath, pathTool.join(ROOT_DIR, DEFAULT_APPLET_BINARY_FILE_PATH));
		});

		it('should not change absolute path', async function () {
			const actualAbsolutePath = await getAppletEntryFileAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'entry-file-path': EXISTING_ABSOLUTE_FILE_PATH,
			});

			assertPathsEqual(actualAbsolutePath, EXISTING_ABSOLUTE_FILE_PATH);
		});

		it('should change relative path to absolute', async function () {
			const actualAbsolutePath = await getAppletEntryFileAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'entry-file-path': EXISTING_RELATIVE_FILE_PATH,
			});

			assertPathsEqual(actualAbsolutePath, pathTool.join(ROOT_DIR, EXISTING_RELATIVE_FILE_PATH));
		});

		it('should fail if the absolute path does not exist', async function () {
			let failed = false;
			try {
				await getAppletEntryFileAbsolutePath(ROOT_DIR, {
					...generalOptions,
					'entry-file-path': pathTool.normalize('/nonExistingAbsolutePath'),
				});
			} catch {
				failed = true;
			}

			should.equal(failed, true);
		});

		it('should fail if the absolute path is not a file', async function () {
			let failed = false;
			try {
				await getAppletEntryFileAbsolutePath(ROOT_DIR, {
					...generalOptions,
					'entry-file-path': EXISTING_ABSOLUTE_DIR_PATH,
				});
			} catch {
				failed = true;
			}

			should.equal(failed, true);
		});

		it('should fail if the relative path is not a file', async function () {
			let failed = false;
			try {
				await getAppletEntryFileAbsolutePath(ROOT_DIR, {
					...generalOptions,
					'entry-file-path': EXISTING_RELATIVE_DIR_PATH,
				});
			} catch {
				failed = true;
			}

			should.equal(failed, true);
		});
	});

	describe('getAppletEntryFileRelativePath', function () {
		it('should return relative path - sub folder', async function () {
			const actualRelativePath = getAppletEntryFileRelativePath('/applet/src/index.js', '/applet');

			should.equal(actualRelativePath, 'src/index.js');
		});

		it('should return relative path - the same folder', async function () {
			const actualRelativePath = getAppletEntryFileRelativePath('/applet/index.js', '/applet');

			should.equal(actualRelativePath, 'index.js');
		});

		it('should fail - different folders', async function () {
			let failed = false;
			try {
				getAppletEntryFileRelativePath('/applet/index.js', '/src');
			} catch {
				failed = true;
			}

			should.equal(failed, true);
		});

		it('should fail - more inner folder', async function () {
			let failed = false;
			try {
				getAppletEntryFileRelativePath('/applet/index.js', '/applet/src');
			} catch {
				failed = true;
			}

			should.equal(failed, true);
		});
	});
});

// Helper to normalize path assertions
function assertPathsEqual(actual: string, expected: string) {
	should.equal(pathTool.normalize(actual), pathTool.normalize(expected));
}
