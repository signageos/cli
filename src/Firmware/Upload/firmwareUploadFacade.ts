import * as path from 'path';
import RestApi from "@signageos/sdk/dist/RestApi/RestApi";
import { ProgressBar } from "../../CommandLine/IProgressBar";
import { IFirmwareVersionCreatable } from "@signageos/sdk/dist/RestApi/Firmware/Version/IFirmwareVersion";
import * as fs from 'fs-extra';
import { computeMD5 } from "../../Stream/helper";

export async function uploadFirmwareVersion(parameters: {
	restApi: RestApi;
	firmware: IFirmwareVersionCreatable;
	pathArr: Array<string>;
	progressBar?: ProgressBar;
}): Promise<void> {
	const { restApi, firmware, pathArr, progressBar } = parameters;

	const sizes = await Promise.all(pathArr.map(async (filePath: string) => {
		const stat = await fs.stat(filePath);
		return stat.size;
	}));
	const totalSize = sizes.reduce((sum: number, size) => sum + size, 0);

	if (progressBar) {
		progressBar.init({ size: totalSize, name: pathArr.join(',') });
	}

	for (let index in pathArr) {
		const filePath = pathArr[index];
		const fileSize = sizes[index];
		const fileName = path.basename(filePath);

		const streamForComputation = fs.createReadStream(filePath);
		const md5Hash = await computeMD5(streamForComputation);

		const stream = fs.createReadStream(filePath);
		stream.pause();
		stream.on('data', (chunk: Buffer) => {
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
		await restApi.firmwareVersion.create(firmware);
	} finally {
		if (progressBar) {
			progressBar.end();
		}
	}
}
