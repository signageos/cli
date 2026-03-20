import * as path from 'path';
import file from '@signageos/file';
import { createHash } from 'crypto';
import * as fs from 'fs-extra';
import debug from 'debug';
import { loadPackage } from '@signageos/sdk/dist/FileSystem/packageConfig';
const Debug = debug('@signageos/cli:FileSystem:helper');

export const SOS_CONFIG_FILE_NAME = '.sosconfig.json';

const DEFAULT_FILE_TYPE = 'application/octet-stream';

export async function getFileType(filePath: string) {
	const fileResult = await file(filePath, { mimeType: true });
	Debug('file type', filePath, fileResult);

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

/**
 * Writes the latest @signageos/front-applet version into the .sosconfig.json of the generated project.
 */
export async function addFrontAppletVersionToConfigFile(targetDir: string, frontAppletVersion: string) {
	const configPath = path.join(targetDir, SOS_CONFIG_FILE_NAME);
	if (!(await fs.pathExists(configPath))) {
		return;
	}
	const rawContent = await fs.readFile(configPath, 'utf-8');
	try {
		const content = JSON.parse(rawContent);
		content.sos = { ...content.sos, '@signageos/front-applet': frontAppletVersion };
		await fs.writeFile(configPath, JSON.stringify(content, undefined, '\t') + '\n');
	} catch (error) {
		throw new Error(`Invalid JSON in ${SOS_CONFIG_FILE_NAME}: ${error instanceof Error ? error.message : String(error)}`);
	}
}

export async function getFileMD5Checksum(filePath: string) {
	const hash = createHash('md5');
	const stream = fs.createReadStream(filePath);

	return new Promise<string>((resolve, reject) => {
		stream.on('data', (data) => hash.update(data));
		stream.on('end', () => resolve(hash.digest('base64')));
		stream.on('error', reject);
	});
}
