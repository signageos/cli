import * as fs from 'fs-extra';
import * as path from 'path';
import { CommandLineOptions } from '../../Command/commandDefinition';

export const ENTRY_FILE_PATH_OPTION = {
	name: 'entry-file-path',
	type: String,
	description: 'Path to the applet entry file. Relative to the command or absolute.',
} as const;

export const APPLET_PATH_OPTION = {
	name: 'applet-path',
	type: String,
	description: 'Path to the applet file or the project folder depending on the entry file. Relative to the command or absolute.',
} as const;

export const DEFAULT_APPLET_DIR_PATH = '.';
export const DEFAULT_APPLET_ENTRY_FILE_PATH = 'dist/index.html';
export const DEFAULT_APPLET_BINARY_FILE_PATH = 'dist/index.html';

export async function getAppletDirectoryAbsolutePath(
	currentDirectory: string,
	options: CommandLineOptions<[typeof APPLET_PATH_OPTION]>,
): Promise<string> {
	let appletDirectoryPath: string | undefined = options['applet-path'];

	if (!appletDirectoryPath) {
		appletDirectoryPath = DEFAULT_APPLET_DIR_PATH;
	}
	if (!path.isAbsolute(appletDirectoryPath)) {
		appletDirectoryPath = path.join(currentDirectory, appletDirectoryPath);
	}
	if (appletDirectoryPath.length > 1 && appletDirectoryPath[appletDirectoryPath.length - 1] === '/') {
		appletDirectoryPath = appletDirectoryPath.substring(0, appletDirectoryPath.length - 1);
	}
	console.log(`\nUse applet project directory path: ${appletDirectoryPath}`);

	const appletDirectoryPathExists = await fs.pathExists(appletDirectoryPath);
	if (!appletDirectoryPathExists) {
		throw new Error(`Applet project directory not found: ${appletDirectoryPath}`);
	}

	const isDirectory = (await fs.stat(appletDirectoryPath)).isDirectory();
	if (!isDirectory) {
		throw new Error(`Applet project path is not a directory: ${appletDirectoryPath}`);
	}

	return appletDirectoryPath;
}

export async function getAppletBinaryFileAbsolutePath(
	currentDirectory: string,
	options: CommandLineOptions<[typeof APPLET_PATH_OPTION]>,
): Promise<string> {
	let appletBinaryFilePath: string | undefined = options['applet-path'];

	if (!appletBinaryFilePath) {
		appletBinaryFilePath = DEFAULT_APPLET_BINARY_FILE_PATH;
	}
	if (!path.isAbsolute(appletBinaryFilePath)) {
		appletBinaryFilePath = path.join(currentDirectory, appletBinaryFilePath);
	}
	console.log(`\nUse applet binary file: ${appletBinaryFilePath}`);

	const appletBinaryFilePathExists = await fs.pathExists(appletBinaryFilePath);
	if (!appletBinaryFilePathExists) {
		throw new Error(`Applet binary file not found: ${appletBinaryFilePath}`);
	}

	const isFile = (await fs.stat(appletBinaryFilePath)).isFile();
	if (!isFile) {
		throw new Error(`Applet binary path is not a file: ${appletBinaryFilePath}`);
	}

	return appletBinaryFilePath;
}

export async function getAppletEntryFileAbsolutePath(
	currentDirectory: string,
	options: CommandLineOptions<[typeof ENTRY_FILE_PATH_OPTION]>,
): Promise<string> {
	let appletEntryFilePath: string | undefined = options['entry-file-path'];

	if (!appletEntryFilePath) {
		appletEntryFilePath = DEFAULT_APPLET_ENTRY_FILE_PATH;
	}
	if (!path.isAbsolute(appletEntryFilePath)) {
		appletEntryFilePath = path.join(currentDirectory, appletEntryFilePath);
	}
	console.log(`\nUse applet entry file: ${appletEntryFilePath}`);

	const appletEntryFilePathExists = await fs.pathExists(appletEntryFilePath);
	if (!appletEntryFilePathExists) {
		throw new Error(`Applet entry file not found: ${appletEntryFilePath} , did you forget to build your applet?`);
	}

	const isFile = (await fs.stat(appletEntryFilePath)).isFile();
	if (!isFile) {
		throw new Error(`Applet entry path is not a file: ${appletEntryFilePath}`);
	}

	return appletEntryFilePath;
}

export function getAppletEntryFileRelativePath(entryFileAbsolutePath: string, appletDirectoryAbsolutePath: string) {
	const appletDirectoryAbsolutePathNormalized = path.normalize(appletDirectoryAbsolutePath);
	const entryFileAbsolutePathNormalized = path.normalize(entryFileAbsolutePath);

	if (!path.isAbsolute(entryFileAbsolutePathNormalized)) {
		throw new Error(`Internal Error: Try input relative entry file path. Current path: ${entryFileAbsolutePathNormalized}`);
	}
	if (!path.isAbsolute(appletDirectoryAbsolutePathNormalized)) {
		throw new Error(`Internal Error: Try input relative applet directory path. Current path: ${appletDirectoryAbsolutePathNormalized}`);
	}

	const isEntryFileInAppletDir = entryFileAbsolutePathNormalized.startsWith(appletDirectoryAbsolutePathNormalized);
	if (!isEntryFileInAppletDir) {
		throw new Error(`Applet entry file must be in the applet directory.` +
		`\nEntry file path: ${entryFileAbsolutePathNormalized}` +
		`\nApplet directory path: ${appletDirectoryAbsolutePathNormalized}`);
	}

	const entryFileRelativePath = entryFileAbsolutePathNormalized.substring(appletDirectoryAbsolutePathNormalized.length + 1);

	return entryFileRelativePath;
}
