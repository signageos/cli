import should from 'should';
import * as pathTool from 'path';
import rewireMock from 'rewiremock';

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
		if (path === '' || path === '.' || path === '/' || path === normalizePath('/')) {
			return true;
		}

		const normalizedPath = normalizePath(path);
		const validPaths = [
			normalizePath(pathTool.join(ROOT_DIR, EXISTING_RELATIVE_DIR_PATH)),
			normalizePath(pathTool.join(ROOT_DIR, EXISTING_RELATIVE_FILE_PATH)),
			normalizePath(EXISTING_ABSOLUTE_FILE_PATH),
			normalizePath(EXISTING_ABSOLUTE_DIR_PATH),
			normalizePath(pathTool.join(ROOT_DIR, DEFAULT_APPLET_BINARY_FILE_PATH)),
			normalizePath(pathTool.join(ROOT_DIR, DEFAULT_APPLET_ENTRY_FILE_PATH)),
			normalizePath(pathTool.join(ROOT_DIR, DEFAULT_APPLET_DIR_PATH)),
			normalizePath(ROOT_DIR), // Root directory
		];

		return validPaths.includes(normalizedPath);
	},
	stat: (path: string) => {
		// Special case for root directory which may be normalized differently on different platforms
		if (path === '' || path === '.' || path === '/' || path === normalizePath('/')) {
			return Promise.resolve({
				isDirectory: () => true,
				isFile: () => false,
			});
		}

		const normalizedPath = normalizePath(path);
		return Promise.resolve({
			isDirectory: () => {
				return [
					normalizePath(pathTool.join(ROOT_DIR, EXISTING_RELATIVE_DIR_PATH)),
					normalizePath(EXISTING_ABSOLUTE_DIR_PATH),
					normalizePath(pathTool.join(ROOT_DIR, DEFAULT_APPLET_DIR_PATH)),
					normalizePath(ROOT_DIR), // Root directory
				].some((validPath) => normalizedPath === validPath);
			},
			isFile: () => {
				return [
					normalizePath(pathTool.join(ROOT_DIR, EXISTING_RELATIVE_FILE_PATH)),
					normalizePath(EXISTING_ABSOLUTE_FILE_PATH),
					normalizePath(pathTool.join(ROOT_DIR, DEFAULT_APPLET_BINARY_FILE_PATH)),
					normalizePath(pathTool.join(ROOT_DIR, DEFAULT_APPLET_ENTRY_FILE_PATH)),
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

describe('unit.appletUploadCommandHelper', () => {
	describe('getAppletDirectoryAbsolutePath', () => {
		it('should use default applet directory', async () => {
			const actualAbsolutePath = await getAppletDirectoryAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'applet-path': DEFAULT_APPLET_DIR_PATH,
			});

			// The implementation resolves "." to the current directory, not the root directory
			// This matches the intended behavior
			assertPathsEqual(actualAbsolutePath, ROOT_DIR);
		});

		it('should not change absolute path', async () => {
			const actualAbsolutePath = await getAppletDirectoryAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'applet-path': EXISTING_ABSOLUTE_DIR_PATH,
			});

			assertPathsEqual(actualAbsolutePath, EXISTING_ABSOLUTE_DIR_PATH);
		});

		it('should change relative path to absolute', async () => {
			const actualAbsolutePath = await getAppletDirectoryAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'applet-path': EXISTING_RELATIVE_DIR_PATH,
			});

			assertPathsEqual(actualAbsolutePath, pathTool.join(ROOT_DIR, EXISTING_RELATIVE_DIR_PATH));
		});

		it('should remove trailing slash - relative path', async () => {
			const actualAbsolutePath = await getAppletDirectoryAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'applet-path': EXISTING_RELATIVE_DIR_PATH + '/',
			});

			assertPathsEqual(actualAbsolutePath, pathTool.join(ROOT_DIR, EXISTING_RELATIVE_DIR_PATH));
		});

		it('should remove trailing slash - absolute path', async () => {
			const actualAbsolutePath = await getAppletDirectoryAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'applet-path': EXISTING_ABSOLUTE_DIR_PATH + '/',
			});

			assertPathsEqual(actualAbsolutePath, EXISTING_ABSOLUTE_DIR_PATH);
		});

		it('should fail if the absolute path does not exist', async () => {
			let failed = false;
			try {
				await getAppletDirectoryAbsolutePath(ROOT_DIR, {
					...generalOptions,
					'applet-path': normalizePath('/nonExistingAbsolutePath'),
				});
			} catch (error) {
				failed = true;
			}

			should.equal(failed, true);
		});

		it('should fail if the absolute path is not a directory', async () => {
			let failed = false;
			try {
				await getAppletDirectoryAbsolutePath(ROOT_DIR, {
					...generalOptions,
					'applet-path': EXISTING_ABSOLUTE_FILE_PATH,
				});
			} catch (error) {
				failed = true;
			}

			should.equal(failed, true);
		});

		it('should fail if the relative path is not a directory', async () => {
			let failed = false;
			try {
				await getAppletDirectoryAbsolutePath(ROOT_DIR, {
					...generalOptions,
					'applet-path': EXISTING_RELATIVE_FILE_PATH,
				});
			} catch (error) {
				failed = true;
			}

			should.equal(failed, true);
		});
	});

	describe('getAppletBinaryFileAbsolutePath', () => {
		it('should use default applet binary file', async () => {
			const actualAbsolutePath = await getAppletBinaryFileAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'applet-path': DEFAULT_APPLET_BINARY_FILE_PATH,
			});

			assertPathsEqual(actualAbsolutePath, pathTool.join(ROOT_DIR, DEFAULT_APPLET_BINARY_FILE_PATH));
		});

		it('should not change absolute path', async () => {
			const actualAbsolutePath = await getAppletBinaryFileAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'applet-path': EXISTING_ABSOLUTE_FILE_PATH,
			});

			assertPathsEqual(actualAbsolutePath, EXISTING_ABSOLUTE_FILE_PATH);
		});

		it('should change relative path to absolute', async () => {
			const actualAbsolutePath = await getAppletBinaryFileAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'applet-path': EXISTING_RELATIVE_FILE_PATH,
			});

			assertPathsEqual(actualAbsolutePath, pathTool.join(ROOT_DIR, EXISTING_RELATIVE_FILE_PATH));
		});

		it('should fail if the absolute path does not exist', async () => {
			let failed = false;
			try {
				await getAppletBinaryFileAbsolutePath(ROOT_DIR, {
					...generalOptions,
					'applet-path': normalizePath('/nonExistingAbsolutePath'),
				});
			} catch (error) {
				failed = true;
			}

			should.equal(failed, true);
		});

		it('should fail if the absolute path is not a file', async () => {
			let failed = false;
			try {
				await getAppletBinaryFileAbsolutePath(ROOT_DIR, {
					...generalOptions,
					'applet-path': EXISTING_ABSOLUTE_DIR_PATH,
				});
			} catch (error) {
				failed = true;
			}

			should.equal(failed, true);
		});

		it('should fail if the relative path is not a file', async () => {
			let failed = false;
			try {
				await getAppletBinaryFileAbsolutePath(ROOT_DIR, {
					...generalOptions,
					'applet-path': EXISTING_RELATIVE_DIR_PATH,
				});
			} catch (error) {
				failed = true;
			}

			should.equal(failed, true);
		});
	});

	describe('getAppletEntryFileAbsolutePath', () => {
		it('should use default applet binary file', async () => {
			const actualAbsolutePath = await getAppletEntryFileAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'entry-file-path': DEFAULT_APPLET_ENTRY_FILE_PATH,
			});

			assertPathsEqual(actualAbsolutePath, pathTool.join(ROOT_DIR, DEFAULT_APPLET_BINARY_FILE_PATH));
		});

		it('should not change absolute path', async () => {
			const actualAbsolutePath = await getAppletEntryFileAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'entry-file-path': EXISTING_ABSOLUTE_FILE_PATH,
			});

			assertPathsEqual(actualAbsolutePath, EXISTING_ABSOLUTE_FILE_PATH);
		});

		it('should change relative path to absolute', async () => {
			const actualAbsolutePath = await getAppletEntryFileAbsolutePath(ROOT_DIR, {
				...generalOptions,
				'entry-file-path': EXISTING_RELATIVE_FILE_PATH,
			});

			assertPathsEqual(actualAbsolutePath, pathTool.join(ROOT_DIR, EXISTING_RELATIVE_FILE_PATH));
		});

		it('should fail if the absolute path does not exist', async () => {
			let failed = false;
			try {
				await getAppletEntryFileAbsolutePath(ROOT_DIR, {
					...generalOptions,
					'entry-file-path': normalizePath('/nonExistingAbsolutePath'),
				});
			} catch (error) {
				failed = true;
			}

			should.equal(failed, true);
		});

		it('should fail if the absolute path is not a file', async () => {
			let failed = false;
			try {
				await getAppletEntryFileAbsolutePath(ROOT_DIR, {
					...generalOptions,
					'entry-file-path': EXISTING_ABSOLUTE_DIR_PATH,
				});
			} catch (error) {
				failed = true;
			}

			should.equal(failed, true);
		});

		it('should fail if the relative path is not a file', async () => {
			let failed = false;
			try {
				await getAppletEntryFileAbsolutePath(ROOT_DIR, {
					...generalOptions,
					'entry-file-path': EXISTING_RELATIVE_DIR_PATH,
				});
			} catch (error) {
				failed = true;
			}

			should.equal(failed, true);
		});
	});

	describe('getAppletEntryFileRelativePath', () => {
		it('should return relative path - sub folder', async () => {
			const actualRelativePath = getAppletEntryFileRelativePath('/applet/src/index.js', '/applet');

			should.equal(actualRelativePath, 'src/index.js');
		});

		it('should return relative path - the same folder', async () => {
			const actualRelativePath = getAppletEntryFileRelativePath('/applet/index.js', '/applet');

			should.equal(actualRelativePath, 'index.js');
		});

		it('should fail - different folders', async () => {
			let failed = false;
			try {
				getAppletEntryFileRelativePath('/applet/index.js', '/src');
			} catch (error) {
				failed = true;
			}

			should.equal(failed, true);
		});

		it('should fail - more inner folder', async () => {
			let failed = false;
			try {
				getAppletEntryFileRelativePath('/applet/index.js', '/applet/src');
			} catch (error) {
				failed = true;
			}

			should.equal(failed, true);
		});
	});
});

// Simple helper to normalize paths for platform compatibility
function normalizePath(p: string): string {
	return pathTool.normalize(p);
}

// Helper to normalize path assertions
function assertPathsEqual(actual: string, expected: string) {
	should.equal(normalizePath(actual), normalizePath(expected));
}
