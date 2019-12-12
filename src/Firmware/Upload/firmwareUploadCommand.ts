import ICommand from "../../Command/ICommand";
import { createFirmwareVersionRestApi } from "../../helper";
import * as prompts from "prompts";
import * as fs from 'fs-extra';
import chalk from 'chalk';
import { IFirmwareVersionCreatable } from "@signageos/sdk/dist/RestApi/Firmware/Version/IFirmwareVersion";
import { computeMD5 } from "../../Stream/helper";

const questions = [
	{
		type: 'text',
		name: 'applicationType',
		message: `Application type`,
	},
	{
		type: 'text',
		name: 'version',
		message: `Firmware version`,
	},
];

export const firmwareUpload: ICommand = {
	name: 'upload',
	description: 'Uploads selected firmware version',
	optionList: [],
	commands: [],
	async run() {
		const restApi = await createFirmwareVersionRestApi();
		// @ts-ignore ignores 'type' property in questions array
		const { applicationType, version } = await prompts(questions);
		if (!applicationType || !version) {
			console.log(`${chalk.red('You must input application type and version')}`);
			return;
		}
		const pathSet = new Set<string>();
		while (true) { // ask for files
			const answer = await prompts({
				type: 'text',
				name: 'fileFsPath',
				message: 'Absolute path to the file, type `stop` to stop.',
			});
			if (answer.fileFsPath === undefined || answer.fileFsPath === 'stop') { // EOF or stop
				break;
			}
			const path = answer.fileFsPath;
			if (fs.existsSync(path)) {
				const stats = fs.statSync(path);
				if (!stats.isFile()) {
					console.log(`${chalk.red('Given path is not file')}`);
					continue;
				}
				pathSet.add(path);
				console.log(`${chalk.green('File added to upload list')}`);
			} else {
				console.log(`${chalk.red('File doesn\'t exist on file system, try again')}`);
			}
		}

		if (pathSet.size > 0) {

			console.log('Application type: ', chalk.green(applicationType));
			console.log('Version: ', chalk.green(version));
			console.log('List of files: ', Array.from(pathSet));

			const confirmation = await prompts({
				type: 'confirm',
				name: 'confirmed',
				message: 'Is this ok?',
			});
			if (confirmation.confirmed) {
				const data: IFirmwareVersionCreatable = {
					applicationType,
					version,
					files: [],
				};

				for (let filePath of Array.from(pathSet)) {

					const stream = await fs.createReadStream(filePath);
					const streamForComputation = await fs.createReadStream(filePath);
					const fileSize = (await fs.stat(filePath)).size;
					const md5Hash = await computeMD5(streamForComputation);
					data.files.push({
						hash: md5Hash,
						content: stream,
						size: fileSize,
					});
				}
				console.log('uploading...');
				await restApi.firmwareVersion.create(data);
			} else {
				console.log(`${chalk.yellow('No action applied')}`);
			}
		}
	},
};
