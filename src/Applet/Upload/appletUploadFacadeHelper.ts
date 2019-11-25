import * as path from 'path';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import IAppletVersionFile from '@signageos/sdk/dist/RestApi/Applet/Version/File/IAppletVersionFile';

export function getAppletFileRelativePath(fileAbsolutePath: string, directoryAbsolutePath: string) {
	if (!path.isAbsolute(fileAbsolutePath)) {
		throw new Error(`Internal Error: Got relative file path, but need absolute to continue. Current path: ${fileAbsolutePath}`);
	}
	if (!path.isAbsolute(directoryAbsolutePath)) {
		throw new Error(`Internal Error: Try input absolute applet directory path. Current path: ${directoryAbsolutePath}`);
	}

	const isFileInAppletDir = fileAbsolutePath.startsWith(directoryAbsolutePath);
	if (!isFileInAppletDir) {
		throw new Error(`Applet entry file must be in the applet directory.` +
		`\nFile path: ${fileAbsolutePath}` +
		`\nApplet directory path: ${directoryAbsolutePath}`);
	}

	const fileRelativePath = fileAbsolutePath.substring(directoryAbsolutePath.length + 1);

	return fileRelativePath;
}

export async function getAppletFilesDictionary(
	restApi: RestApi,
	appletUid: string,
	appletVersion: string,
): Promise<{[fileRelativePath: string]: IAppletVersionFile}> {
	const filesDictionary: {[fileRelativePath: string]: IAppletVersionFile} = {};

	const currentAppletFiles = await restApi.applet.version.file.list(
		appletUid,
		appletVersion,
	);

	currentAppletFiles.forEach((file: IAppletVersionFile) => {
		filesDictionary[file.path] = file;
	});

	return filesDictionary;
}
