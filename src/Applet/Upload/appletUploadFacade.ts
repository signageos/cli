import * as path from 'path';
import * as fs from 'fs-extra';
import chalk from 'chalk';
import debug from 'debug';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import NotFoundError from '@signageos/sdk/dist/RestApi/Error/NotFoundError';
import { getAppletFileRelativePath, getAppletFilesDictionary } from './appletUploadFacadeHelper';
import { getFileType, getFileMD5Checksum } from '../../Lib/fileSystem';
import { ProgressBar } from '../../CommandLine/IProgressBar';
import { log } from '@signageos/sdk/dist/Console/log';

const Debug = debug('@signageos/cli:Applet:Upload:appletUploadFacade');

export async function updateSingleFileApplet(parameters: {
	restApi: RestApi;
	applet: {
		uid: string;
		version: string;
		binaryFilePath: string;
		/** @deprecated Optional value for set current version of front-applet package */
		frontAppletVersion?: string;
	};
}) {
	const { restApi, applet } = parameters;
	const appletBinary = fs.createReadStream(applet.binaryFilePath, { encoding: 'utf8' });
	await restApi.applet.version.update(applet.uid, applet.version, {
		binary: appletBinary,
		frontAppletVersion: applet.frontAppletVersion,
	});
}

export const updateMultiFileApplet = async (parameters: {
	restApi: RestApi;
	applet: {
		uid: string;
		version: string;
		entryFilePath: string;
		directoryPath: string;
		files: string[];
	};
	progressBar?: ProgressBar;
}) => {
	const { restApi, applet, progressBar } = parameters;
	const currentAppletFiles = await getAppletFilesDictionary(restApi, applet.uid, applet.version);
	let changedFilesCounter = 0;

	for (let index = 0; index < applet.files.length; index++) {
		const fileAbsolutePath = applet.files[index];
		if (!fileAbsolutePath) {
			continue;
		}
		const fileRelativePath = getAppletFileRelativePath(fileAbsolutePath, applet.directoryPath);
		const fileRelativePosixPath = path.posix.normalize(fileRelativePath.replace(/\\/g, '/'));
		const fileStats = await fs.stat(fileAbsolutePath);
		const fileSize = fileStats.size;
		const fileHash = await getFileMD5Checksum(fileAbsolutePath);
		const fileType = await getFileType(fileAbsolutePath);
		const currentFileHash = currentAppletFiles[fileRelativePosixPath]?.hash;
		const currentFileType = currentAppletFiles[fileRelativePosixPath]?.type;

		delete currentAppletFiles[fileRelativePosixPath];

		Debug('check file changed', fileHash, currentFileHash, fileType, currentFileType);

		if (fileHash === currentFileHash && fileType === currentFileType) {
			continue;
		} else {
			changedFilesCounter++;
			log('info', chalk.yellow(` Uploading ${fileAbsolutePath}`));
		}

		if (progressBar) {
			progressBar.init({ size: fileSize, name: fileRelativePath });
		}

		const fileStream = fs.createReadStream(fileAbsolutePath);
		fileStream.pause();
		fileStream.on('data', (chunk: string | Buffer) => {
			if (progressBar) {
				progressBar.update({ add: chunk.length });
			}
		});
		try {
			// update file is just alias to create file (both are idempotent)
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
				{ build: false },
			);
		} catch (error) {
			if (fileSize === 0) {
				throw new Error(`Empty files are temporarily disallowed ${fileAbsolutePath}`);
			}
			throw error;
		}
	}

	for (const fileRelativePath in currentAppletFiles) {
		if (currentAppletFiles.hasOwnProperty(fileRelativePath)) {
			try {
				await restApi.applet.version.file.remove(applet.uid, applet.version, fileRelativePath, { build: false });
			} catch (error) {
				if (error instanceof NotFoundError) {
					/*
					 * This means that the file we are trying to remove somehow already got removed.
					 * It's not expected behavior but the running CLI command shouldn't fail because of it.
					 * Probably it's caused by some other process interfering.
					 */
					Debug(`remove old file ${fileRelativePath} failed`);
				} else {
					throw error;
				}
			}
			changedFilesCounter++;
		}
	}

	const appletVersion = await restApi.applet.version.get(applet.uid, applet.version);
	const appletEntryFilePosixPath = path.posix.normalize(applet.entryFilePath.replace(/\\/g, '/'));
	if (changedFilesCounter > 0 || appletVersion.entryFile !== appletEntryFilePosixPath) {
		// The update applet version has to be the last after upload all files to trigger applet version build
		await restApi.applet.version.update(applet.uid, applet.version, {
			entryFile: appletEntryFilePosixPath,
		});
	}

	if (progressBar) {
		progressBar.end();
	}

	if (changedFilesCounter === 0) {
		log('info', `No files changed in ${chalk.yellow.bold(applet.directoryPath)}`);
	}
};

export const createSingleFileApplet = async (parameters: {
	restApi: RestApi;
	applet: {
		uid: string;
		version: string;
		binaryFilePath: string;
		/** @deprecated Optional value for set current version of front-applet package */
		frontAppletVersion?: string;
	};
}) => {
	const { restApi, applet } = parameters;
	const appletBinary = fs.createReadStream(applet.binaryFilePath, { encoding: 'utf8' });
	await restApi.applet.version.create(applet.uid, {
		binary: appletBinary,
		version: applet.version,
		frontAppletVersion: applet.frontAppletVersion,
	});
};

export const createMultiFileFileApplet = async (parameters: {
	restApi: RestApi;
	applet: {
		uid: string;
		version: string;
		entryFilePath: string;
		directoryPath: string;
		files: string[];
	};
	progressBar?: ProgressBar;
}) => {
	const { restApi, applet, progressBar } = parameters;
	const appletEntryFilePosixPath = path.posix.normalize(applet.entryFilePath.replace(/\\/g, '/'));

	try {
		await restApi.applet.version.create(applet.uid, {
			version: applet.version,
			entryFile: appletEntryFilePosixPath,
		});

		await Promise.all(
			applet.files.map(async (fileAbsolutePath) => {
				const fileRelativePath = getAppletFileRelativePath(fileAbsolutePath, applet.directoryPath);
				const fileHash = await getFileMD5Checksum(fileAbsolutePath);
				const fileType = await getFileType(fileAbsolutePath);
				const fileSize = (await fs.stat(fileAbsolutePath)).size;

				if (fileSize === 0) {
					throw new Error(`Empty files are temporarily disallowed ${fileAbsolutePath}`);
				}

				if (progressBar) {
					progressBar.init({ size: fileSize, name: fileRelativePath });
				}

				const fileStream = fs.createReadStream(fileAbsolutePath);
				fileStream.pause();
				fileStream.on('data', (chunk: string | Buffer) => {
					if (progressBar) {
						progressBar.update({ add: chunk.length });
					}
				});

				const filePosixPath = path.posix.normalize(fileRelativePath.replace(/\\/g, '/'));

				log('info', chalk.yellow(` Uploading ${fileAbsolutePath}`));
				return restApi.applet.version.file.create(
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
					{ build: false },
				);
			}),
		);
	} finally {
		if (progressBar) {
			progressBar.end();
		}
	}

	// The extra update applet version which has to be after upload all files to trigger applet version build
	await restApi.applet.version.update(applet.uid, applet.version, {
		entryFile: appletEntryFilePosixPath,
	});
};
