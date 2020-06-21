import * as fs from 'fs-extra';
import * as path from 'path';
import file from '@signageos/file';
import * as glob from 'globby';
import chalk from 'chalk';
import * as Debug from 'debug';
import { computeMD5 } from '../Stream/helper';
const debug = Debug('@signageos/cli:FileSystem:helper');

const parseIgnoreFile: (input: Buffer) => string[] = require('parse-gitignore');

const DEFAULT_IGNORE_FILE = '.sosignore';
const IGNORE_FILES = [DEFAULT_IGNORE_FILE, '.npmignore', '.gitignore'];
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

export async function listDirectoryContentRecursively(appletDirPath: string, ignoreFileDirPath: string): Promise<string[]> {
	const ignorePatterns: string[] = [];
	let usedIgnoreFilePath: undefined | string = undefined;

	for (let index = 0; index < IGNORE_FILES.length; index++) {
		const ignoreFileName = IGNORE_FILES[index];

		const ignoreFilePath = path.join(ignoreFileDirPath, ignoreFileName);
		const ignoreFileExists = await fs.pathExists(ignoreFilePath);
		if (ignoreFileExists) {
			usedIgnoreFilePath = ignoreFilePath;
			break;
		}
	}

	if (usedIgnoreFilePath) {
		console.log(`Use ignore file: ${chalk.green.bold(usedIgnoreFilePath)}.`);
	} else {
		console.log(`No ignore file found in ${chalk.yellow.bold(ignoreFileDirPath)}.`);
	}

	if (usedIgnoreFilePath) {
		const usedIgnoreFileBuffer = await fs.readFile(usedIgnoreFilePath);
		const ignoreFilePatterns = parseIgnoreFile(usedIgnoreFileBuffer);
		ignoreFilePatterns.forEach((pattern: string) => ignorePatterns.push(`!${pattern}`));
	}

	const files = await glob(
		['**/*', ...ignorePatterns],
		{
			cwd: appletDirPath,
			absolute: true,
			dot: true,
		},
	);
	debug('listed files', files);

	return files;
}
