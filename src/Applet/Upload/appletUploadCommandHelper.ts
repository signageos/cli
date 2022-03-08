import * as fs from 'fs-extra';
import * as path from 'path';
import { CommandLineOptions } from 'command-line-args';
import { loadConfig } from '../../RunControl/runControlHelper';
import { DEFAULT_APPLET_DIR_PATH, DEFAULT_APPLET_BINARY_FILE_PATH, DEFAULT_APPLET_ENTRY_FILE_PATH } from './appletUploadFacade';
import { selectOrganizationUid } from '../../Organization/organizationFacade';

export async function getOrganizationUidOrDefaultOrSelect(options: CommandLineOptions): Promise<string> {
	const config = await loadConfig();
	let organizationUid: string | undefined = options['organization-uid'];

	if (!organizationUid && !options['no-default-organization']) {
		organizationUid = config.defaultOrganizationUid;
	}

	if (!organizationUid) {
		organizationUid = await selectOrganizationUid(options);
	}

	return organizationUid;
}

export async function getAppletDirectoryAbsolutePath(currentDirectory: string, options: CommandLineOptions): Promise<string> {
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

export async function getAppletBinaryFileAbsolutePath(currentDirectory: string, options: CommandLineOptions): Promise<string> {
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

export async function getAppletEntryFileAbsolutePath(currentDirectory: string, options: CommandLineOptions): Promise<string> {
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
