import * as path from 'path';
import file from '@signageos/file';
import { createHash, HexBase64Latin1Encoding } from 'crypto';
import * as fs from 'fs-extra';
import * as Debug from 'debug';
import { loadPackage } from '@signageos/sdk/dist/FileSystem/packageConfig';
const debug = Debug('@signageos/cli:FileSystem:helper');

const DEFAULT_FILE_TYPE = 'application/octet-stream';

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

	if (!isPathIncluded(appletFilePaths, mainFileAbsolutePath)) {
		throw new Error(`${packageConfig.main} is not a part of tracking files`);
	}
}

/**
 * This is the platform/OS idependent way to check if a file is included in a list of files.
 * So there can be backslashes and slashes on Windows and only slashes on Linux/UNIX.
 * This function will ignore differences in slashes. It will only check if the file is included no matter what slashes are used.
 */
export function isPathIncluded(filePaths: string[], filePath: string) {
	const sanitizedFilePath = filePath.replace(/\\/g, '/');
	const sanitizedFilePaths = filePaths.map((filePathItem) => filePathItem.replace(/\\/g, '/'));
	return sanitizedFilePaths.includes(sanitizedFilePath);
}

export async function getFileMD5Checksum(filePath: string, encoding: HexBase64Latin1Encoding) {
	const hash = createHash('md5');
	const stream = fs.createReadStream(filePath);

	return new Promise<string>((resolve, reject) => {
		stream.on('data', (data) => hash.update(data));
		stream.on('end', () => resolve(hash.digest(encoding)));
		stream.on('error', reject);
	});
}
