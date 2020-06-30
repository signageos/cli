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

interface IAppletPackageJson {
	name: string;
	version: string;
	main: string;
	files?: string[];
}

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
	/**
	 * @note file existence is validate the the very beginning of upload
	 */
	const absolutePkgPath = path.join(appletDirPath, 'package.json');
	const pkgJson: IAppletPackageJson = JSON.parse(await fs.readFile(absolutePkgPath, 'utf-8'));
	let files: string[] = [];

	if (pkgJson.files && Array.isArray(pkgJson.files)) {

		const filesSet: Set<string> = prepareFilesToInclude();

		pkgJson.files.forEach((f: string) => {
			filesSet.add(f);
		});
		files = [...filesSet].map((f: string) => path.join(appletDirPath, f));

	} else {

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

		files = await glob(
			['**/*', ...ignorePatterns],
			{
				cwd: appletDirPath,
				absolute: true,
				dot: true,
			},
		);
	}
	debug('listed files', files);

	return files;
}

function prepareFilesToInclude(): Set<string> {
	const alwaysInclude = [
		'package.json',
	];

	return new Set<string> (alwaysInclude);
}

export async function validateAllFormalities(appletDir: string, entryFile: string): Promise<void> {
	let pkgJson: IAppletPackageJson;
	const absolutePkgPath = path.join(appletDir, 'package.json');

	try {
		pkgJson = JSON.parse(await fs.readFile(absolutePkgPath, 'utf-8'));

	} catch {
		throw new Error(`Cannot find package.json file on path ${absolutePkgPath}`);
	}

	if (pkgJson.main !== entryFile) {
		throw new Error(`${pkgJson.main} from package.json file doesn't match with entry file: ${entryFile}`);
	}

}
