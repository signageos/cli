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
	for (let filePath of pathArr) {

		const fileSize = (await fs.stat(filePath)).size;

		if (progressBar) {
			progressBar.init({size: fileSize, name: filePath});
		}

		const stream = await fs.createReadStream(filePath);
		stream.pause();
		stream.on('data', (chunk: Buffer) => {
			if (progressBar) {
				progressBar.update({ add: chunk.length });
			}
		});

		const streamForComputation = await fs.createReadStream(filePath);
		const md5Hash = await computeMD5(streamForComputation);

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
