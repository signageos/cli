import * as path from 'path';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import { ProgressBar } from '../../CommandLine/IProgressBar';
import { IFirmwareVersionCreatable } from '@signageos/sdk/dist/RestApi/Firmware/Version/IFirmwareVersion';
import * as fs from 'fs-extra';
import { getFileMD5Checksum } from '../../Lib/fileSystem';
import chalk from 'chalk';

export async function uploadFirmwareVersion(parameters: {
	restApi: RestApi;
	firmware: IFirmwareVersionCreatable;
	pathArr: Array<string>;
	progressBar?: ProgressBar;
	force?: boolean;
}): Promise<void> {
	const { restApi, firmware, pathArr, progressBar } = parameters;

	const sizes = await Promise.all(
		pathArr.map(async (filePath: string) => {
			const stat = await fs.stat(filePath);
			return stat.size;
		}),
	);

	// Process each file sequentially for cleaner output
	for (const index in pathArr) {
		const filePath = pathArr[index];
		if (!filePath) {
			continue;
		}
		const fileSize = sizes[Number.parseInt(index)];
		if (fileSize === undefined) {
			continue;
		}
		const fileName = path.basename(filePath);

		// Log with newline for cleaner output
		console.info(chalk.yellow(`Uploading ${filePath}\n`));

		if (progressBar) {
			progressBar.init({ size: fileSize, name: fileName });
		}

		const md5Hash = await getFileMD5Checksum(filePath);

		const stream = fs.createReadStream(filePath);
		stream.pause();
		stream.on('data', (chunk: string | Buffer) => {
			if (progressBar) {
				progressBar.update({ add: chunk.length, name: fileName });
			}
		});

		firmware.files.push({
			hash: md5Hash,
			content: stream,
			size: fileSize,
		});
	}
	try {
		await restApi.firmwareVersion.create(firmware, parameters.force);
	} finally {
		if (progressBar) {
			progressBar.end();
		}
	}
}
