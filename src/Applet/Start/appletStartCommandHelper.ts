import * as fs from 'fs-extra';
import * as path from 'path';
import { CommandLineOptions } from '../../Command/commandDefinition';
import { APPLET_PATH_OPTION } from '../Upload/appletUploadCommandHelper';

export const DEFAULT_APPLET_DIR_PATH = 'dist';

export async function getAppletDirAbsolutePath(
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
	console.log(`\nUse applet directory path: ${appletDirectoryPath}`);

	const appletDirectoryPathExists = await fs.pathExists(appletDirectoryPath);
	if (!appletDirectoryPathExists) {
		throw new Error(`Applet directory not found: ${appletDirectoryPath}`);
	}

	const isDirectory = (await fs.stat(appletDirectoryPath)).isDirectory();
	if (!isDirectory) {
		throw new Error(`Applet path is not a directory: ${appletDirectoryPath}`);
	}

	return appletDirectoryPath;
}
