import ICommand from "../../Command/ICommand";
import { createFirmwareVersionRestApi } from "../../helper";
import * as prompts from "prompts";
import chalk from 'chalk';
import { IFirmwareVersionCreatable } from "@signageos/sdk/dist/RestApi/Firmware/Version/IFirmwareVersion";
import { uploadFirmwareVersion } from "./firmwareUploadFacade";
import { createProgressBar } from "../../CommandLine/progressBarFactory";
import { CommandLineOptions } from "command-line-args";
import validateFileExistenceSync from "./firmwareUploadHelper";

const questions = [
	{
		type: 'text' as 'text',
		name: 'applicationType',
		message: `Application type`,
	},
	{
		type: 'text' as 'text',
		name: 'version',
		message: `Firmware version`,
	},
];

export const firmwareUpload: ICommand = {
	name: 'upload',
	description: 'Uploads selected firmware version',
	optionList: [],
	commands: [],
	async run(options: CommandLineOptions) {
		const optionsProvided = !!(options['application-type'] && options['firmware-version'] && options.src && options.src.length > 0);
		const restApi = await createFirmwareVersionRestApi();
		let data: IFirmwareVersionCreatable = {
			applicationType: '',
			version: '',
			files: [],
		};
		const pathSet = new Set<string>();
		let applicationType, version;
		if (!optionsProvided) {
			const answers = await prompts(questions);
			applicationType = answers.applicationType;
			version  = answers.version;

			if (!applicationType || !version) {
				console.log(`${chalk.red('You must input application type and version')}`);
				return;
			}
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
				try {
					validateFileExistenceSync(path);
					pathSet.add(path);
					console.log(`${chalk.green('File added to upload list')}`);
				} catch (e) {
					console.log(`${chalk.yellow(e.message)}`);
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
					data = {
						applicationType,
						version,
						files: [],
					};
				} else {
					throw new Error(`You must confirm your action.`);
				}
			}
		} else { // data is given cli args
			applicationType = options['application-type'];
			version = options['firmware-version'];
			const pathArr: Array<string> = options.src;
			pathArr.forEach((path: string) => {
				validateFileExistenceSync(path);
				pathSet.add(path);
			});

			data = {
				applicationType,
				version,
				files: [],
			};
		}

		const progressBar = createProgressBar();
		await uploadFirmwareVersion(
			{
				restApi,
				firmware: data,
				pathArr: Array.from(pathSet),
				progressBar,
			},
		);
	},
};
