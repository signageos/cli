import * as fs from 'fs-extra';
import * as path from 'path';
import file from '@signageos/file';
import * as Debug from 'debug';
import { computeMD5 } from '../Stream/helper';
import { loadPackage } from '@signageos/sdk/dist/FileSystem/packageConfig';
const debug = Debug('@signageos/cli:FileSystem:helper');

const DEFAULT_FILE_TYPE = 'application/octet-stream';

export async function computeFileMD5(filePath: string) {
	const fileStream = fs.createReadStream(filePath);

	return await computeMD5(fileStream);
}

export async function getFileType(filePath: string) {
	const fileResult = await file(filePath, { mimeType: true });
	debug('file type', filePath, fileResult);

	return fileResult?.mimeType ? fileResult.mimeType : DEFAULT_FILE_TYPE;
}

export async function validateAllFormalities(appletPath: string, entryFileAbsolutePath: string, appletFilePaths: string[]): Promise<void> {
	const packageConfig = await loadPackage(appletPath);
	if (!packageConfig) {
		throw new Error(`Cannot find package.json file in path ${appletPath}`);
	}

	if (!packageConfig.main) {
		const expectedMain = entryFileAbsolutePath.slice(appletPath.length + 1);
		throw new Error(`The package.json is missing "main", but should to be "${expectedMain}"`);
	}

	const mainFileAbsolutePath = path.join(appletPath, packageConfig.main);

	if (mainFileAbsolutePath !== entryFileAbsolutePath) {
		throw new Error(`${packageConfig.main} from package.json file doesn't match with entry file: ${entryFileAbsolutePath}`);
	}

	if (!appletFilePaths.includes(mainFileAbsolutePath)) {
		throw new Error(`${packageConfig.main} is not a part of tracking files`);
	}
}
