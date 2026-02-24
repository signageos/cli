import * as path from 'path';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import IAppletVersionFile from '@signageos/sdk/dist/RestApi/Applet/Version/File/IAppletVersionFile';

export function getAppletFileRelativePath(fileAbsolutePath: string, directoryAbsolutePath: string) {
	const directoryAbsolutePathNormalized = path.normalize(directoryAbsolutePath);
	const fileAbsolutePathNormalized = path.normalize(fileAbsolutePath);

	if (!path.isAbsolute(fileAbsolutePathNormalized)) {
		throw new Error(`Internal Error: Got relative file path, but need absolute to continue. Current path: ${fileAbsolutePathNormalized}`);
	}
	if (!path.isAbsolute(directoryAbsolutePathNormalized)) {
		throw new Error(`Internal Error: Try input absolute applet directory path. Current path: ${directoryAbsolutePathNormalized}`);
	}

	const isFileInAppletDir = fileAbsolutePathNormalized.startsWith(directoryAbsolutePathNormalized);
	if (!isFileInAppletDir) {
		throw new Error(
			`All project files must be in the project directory.` +
				`\nFile path: ${fileAbsolutePathNormalized}` +
				`\nApplet directory path: ${directoryAbsolutePathNormalized}`,
		);
	}

	const fileRelativePath = fileAbsolutePathNormalized.substring(directoryAbsolutePathNormalized.length + 1);

	return fileRelativePath;
}

export async function getAppletFilesDictionary(
	restApi: RestApi,
	appletUid: string,
	appletVersion: string,
): Promise<{
	[path: string]: IAppletVersionFile;
}> {
	const filesDictionary: { [path: string]: IAppletVersionFile } = {};

	const files = await restApi.applet.version.file.list(appletUid, appletVersion);

	for (const file of files) {
		filesDictionary[file.path] = file;
	}

	return filesDictionary;
}
