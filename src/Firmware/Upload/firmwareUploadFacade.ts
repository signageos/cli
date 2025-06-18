import * as path from 'path';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import { ProgressBar } from '../../CommandLine/IProgressBar';
import { IFirmwareVersionCreatable } from '@signageos/sdk/dist/RestApi/Firmware/Version/IFirmwareVersion';
import * as fs from 'fs-extra';
import { getFileMD5Checksum } from '../../Lib/fileSystem';

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
	const totalSize = sizes.reduce((sum: number, size) => sum + size, 0);

	if (progressBar) {
		progressBar.init({ size: totalSize, name: pathArr.join(',') });
	}

	for (const index in pathArr) {
		const filePath = pathArr[index];
		if (!filePath) {
			continue;
		}
		const fileSize = sizes[parseInt(index)];
		const fileName = path.basename(filePath);

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
			size: fileSize ?? 0,
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
