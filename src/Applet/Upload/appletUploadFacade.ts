import * as path from 'path';
import * as fs from 'fs-extra';
import chalk from 'chalk';
import * as Debug from 'debug';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import NotFoundError from '@signageos/sdk/dist/RestApi/Error/NotFoundError';
import { getAppletFileRelativePath, getAppletFilesDictionary } from './appletUploadFacadeHelper';
import { computeFileMD5, getFileType } from '../../FileSystem/helper';
import { ProgressBar } from '../../CommandLine/IProgressBar';

const debug = Debug('@signageos/cli:Applet:Upload:appletUploadFacade');

export const DEFAULT_APPLET_DIR_PATH = '.';
export const DEFAULT_APPLET_ENTRY_FILE_PATH = 'dist/index.html';
export const DEFAULT_APPLET_BINARY_FILE_PATH = 'dist/index.html';

export async function updateSingleFileApplet(parameters: {
	restApi: RestApi;
	applet: {
		uid: string;
		version: string;
		frontAppletVersion: string;
		binaryFilePath: string;
	};
}) {
	const { restApi, applet } = parameters;
	const appletBinary = await fs.createReadStream(applet.binaryFilePath, { encoding: 'utf8' });
	await restApi.applet.version.update(
		applet.uid,
		applet.version,
		{
			binary: appletBinary,
			frontAppletVersion: applet.frontAppletVersion,
		},
	);
}

export const updateMultiFileApplet = async (parameters: {
	restApi: RestApi;
	applet: {
		uid: string;
		version: string;
		frontAppletVersion: string;
		entryFilePath: string;
		directoryPath: string;
		files: string[];
	};
	progressBar?: ProgressBar;
}) => {
	const { restApi, applet, progressBar } = parameters;
	const currentAppletFiles = await getAppletFilesDictionary(restApi, applet.uid, applet.version);
	let changedFilesCounter = 0;

	const appletEntryFilePosixPath = path.posix.normalize(applet.entryFilePath.replace(/\\/g, '/'));
	await restApi.applet.version.update(
		applet.uid,
		applet.version,
		{
			frontAppletVersion: applet.frontAppletVersion,
			entryFile: appletEntryFilePosixPath,
		},
	);

	for (let index = 0; index < applet.files.length; index++) {
		const fileAbsolutePath = applet.files[index];
		const fileRelativePath = getAppletFileRelativePath(fileAbsolutePath, applet.directoryPath);
		const fileRelativePosixPath = path.posix.normalize(fileRelativePath.replace(/\\/g, '/'));
		const fileSize = (await fs.stat(fileAbsolutePath)).size;
		const fileHash = await computeFileMD5(fileAbsolutePath);
		const fileType = await getFileType(fileAbsolutePath); // not correctly detected here
		const currentFileHash = currentAppletFiles[fileRelativePosixPath] ? currentAppletFiles[fileRelativePosixPath].hash : undefined;
		const currentFileType = currentAppletFiles[fileRelativePosixPath] ? currentAppletFiles[fileRelativePosixPath].type : undefined;

		delete currentAppletFiles[fileRelativePosixPath];

		debug('check file changed', fileHash, currentFileHash, fileType, currentFileType);

		if (fileHash === currentFileHash && fileType === currentFileType) {
			continue;
		} else {

			changedFilesCounter++;
			console.log(chalk.yellow(` Uploading ${fileAbsolutePath}`));

		}

		if (progressBar) {
			progressBar.init({size: fileSize, name: fileRelativePath});
		}

		const fileStream = await fs.createReadStream(fileAbsolutePath);
		fileStream.pause();
		fileStream.on('data', (chunk: Buffer) => {
			if (progressBar) {
				progressBar.update({ add: chunk.length });
			}
		});
		try {
			await restApi.applet.version.file.update(
				applet.uid,
				applet.version,
				fileRelativePosixPath,
				{
					content: fileStream,
					hash: fileHash,
					size: fileSize,
					type: fileType,
				},
			);

		} catch (error) {
			if (fileSize === 0) {
				throw new Error(`Empty files are temporarily disallowed ${fileAbsolutePath}`);
			}
			throw error;
		}

	}

	if (progressBar) {
		progressBar.end();
	}

	for (const fileRelativePath in currentAppletFiles) {
		if (currentAppletFiles.hasOwnProperty(fileRelativePath)) {
			try {
				await restApi.applet.version.file.remove(applet.uid, applet.version, fileRelativePath);
			} catch (error) {
				if (error instanceof NotFoundError) {
					/*
					 * This means that the file we are trying to remove somehow already got removed.
					 * It's not expected behavior but the running CLI command shouldn't fail because of it.
					 * Probably it's caused by some other process interfering.
					 */
					debug(`remove old file ${fileRelativePath} failed`);
				} else {
					throw error;
				}
			}
			changedFilesCounter++;
		}
	}

	if (changedFilesCounter === 0) {
		console.log(`No files changed in ${chalk.yellow.bold(applet.directoryPath)}`);
	}
};

export const createSingleFileApplet = async (parameters: {
	restApi: RestApi;
	applet: {
		uid: string;
		version: string;
		frontAppletVersion: string;
		binaryFilePath: string;
	};
}) => {
	const { restApi, applet } = parameters;
	const appletBinary = await fs.createReadStream(applet.binaryFilePath, { encoding: 'utf8' });
	await restApi.applet.version.create(
		applet.uid,
		{
			binary: appletBinary,
			version: applet.version,
			frontAppletVersion: applet.frontAppletVersion,
		},
	);
};

export const createMultiFileFileApplet = async (parameters: {
	restApi: RestApi;
	applet: {
		uid: string;
		version: string;
		frontAppletVersion: string;
		entryFilePath: string;
		directoryPath: string;
		files: string[];
	};
	progressBar?: ProgressBar;
}) => {
	const { restApi, applet, progressBar } = parameters;
	const appletEntryFilePosixPath = path.posix.normalize(applet.entryFilePath.replace(/\\/g, '/'));
	await restApi.applet.version.create(
		applet.uid,
		{
			version: applet.version,
			frontAppletVersion: applet.frontAppletVersion,
			entryFile: appletEntryFilePosixPath,
		},
	);

	for (let index = 0; index < applet.files.length; index++) {
		const fileAbsolutePath = applet.files[index];
		const fileRelativePath = getAppletFileRelativePath(fileAbsolutePath, applet.directoryPath);
		const fileHash = await computeFileMD5(fileAbsolutePath);
		const fileType = await getFileType(fileAbsolutePath);
		const fileSize = (await fs.stat(fileAbsolutePath)).size;

		if (progressBar) {
			progressBar.init({size: fileSize, name: fileRelativePath});
		}

		const fileStream = await fs.createReadStream(fileAbsolutePath);
		fileStream.pause();
		fileStream.on('data', (chunk: Buffer) => {
			if (progressBar) {
				progressBar.update({ add: chunk.length });
			}
		});

		const filePosixPath = path.posix.normalize(fileRelativePath.replace(/\\/g, '/'));

		try {
			console.log(chalk.yellow(` Uploading ${fileAbsolutePath}`));
			await restApi.applet.version.file.create(
				applet.uid,
				applet.version,
				{
					name: path.basename(filePosixPath),
					path: filePosixPath,
					type: fileType,
					hash: fileHash,
					content: fileStream,
					size: fileSize,
				},
			);

		} catch (error) {
			if (fileSize === 0) {
				throw new Error(`Empty files are temporarily disallowed ${fileAbsolutePath}`);
			}
			throw error;
		}

	}

	if (progressBar) {
		progressBar.end();
	}
};
