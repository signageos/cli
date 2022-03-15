import { createFirmwareVersionRestApi } from "../../helper";
import * as prompts from "prompts";
import chalk from 'chalk';
import { IFirmwareVersionCreatable } from "@signageos/sdk/dist/RestApi/Firmware/Version/IFirmwareVersion";
import { uploadFirmwareVersion } from "./firmwareUploadFacade";
import { createProgressBar } from "../../CommandLine/progressBarFactory";
import validateFileExistenceSync from "./firmwareUploadHelper";
import RequestError from "@signageos/sdk/dist/RestApi/Error/RequestError";
import { CommandLineOptions, createCommandDefinition } from "../../Command/commandDefinition";

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
const fwTypeQuestion = [
	{
		type: 'text' as 'text',
		name: 'firmwareType',
		message: `Model prefixed with brand. E.g.: "benq_sl550", "rpi4", "rpi"`,
	},
];
const applicationTypesRequiringType = ['linux', 'android'];

const OPTION_LIST = [
	{ name: 'application-type', alias: 'a', type: String, },
	{ name: 'firmware-version', alias: 'f', type: String, },
	{ name: 'firmware-type', type: String, },
	{ name: 'src', type: String, multiple: true, },
	{ name: 'force', type: Boolean, description: 'When firmware cannot be uploaded due to invalid firmware "type", do it anyways.' },
] as const;

export const firmwareUpload = createCommandDefinition({
	name: 'upload',
	description: 'Uploads selected firmware version',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const optionsProvided = !!(options['application-type'] && options['firmware-version'] && options.src && options.src.length > 0);
		const restApi = await createFirmwareVersionRestApi();
		let data: IFirmwareVersionCreatable = {
			applicationType: '',
			version: '',
			files: [],
		};
		const pathSet = new Set<string>();
		if (!optionsProvided) {
			const answers = await prompts(questions);
			data.applicationType = answers.applicationType;
			data.version = answers.version;
			if (applicationTypesRequiringType.includes(data.applicationType)) {
				const typeAnswers = await prompts(fwTypeQuestion);
				data.type = typeAnswers.firmwareType;
				if (!data.type) {
					console.log(`${chalk.red('You must input firmware type')}`);
					return;
				}
			}

			if (!data.applicationType || !data.version) {
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
				console.log('Application type: ', chalk.green(data.applicationType));
				console.log('Version: ', chalk.green(data.version));
				if (data.type) {
					console.log('Firmware type: ', chalk.green(data.type));
				}
				console.log('List of files: ', Array.from(pathSet));

				const confirmation = await prompts({
					type: 'confirm',
					name: 'confirmed',
					message: 'Is this ok?',
				});
				if (!confirmation.confirmed) {
					throw new Error(`You must confirm your action.`);
				}
			}
		} else { // data is given cli args
			if (!options['application-type']) {
				throw new Error('Argument --application-type is required');
			}
			if (!options['firmware-version']) {
				throw new Error('Argument --firmware-version is required');
			}
			data.applicationType = options['application-type'];
			data.version = options['firmware-version'];
			if (applicationTypesRequiringType.includes(data.applicationType) && !options['firmware-type']) {
				console.log(`${chalk.red('You must input firmware type')}`);
				return;
			}
			data.type = options['firmware-type'];
			const pathArr = options.src;
			pathArr?.forEach((path: string) => {
				validateFileExistenceSync(path);
				pathSet.add(path);
			});
		}

		try {
			await uploadFirmwareVersion(
				{
					restApi,
					firmware: data,
					pathArr: Array.from(pathSet),
					progressBar: createProgressBar(),
				},
			);
		} catch (error) {
			if (error instanceof RequestError && error.errorName === 'INVALID_TYPE_TO_FIRMWARE_VERSION_UPLOAD') {
				const promptOverride = () => prompts({
					type: 'confirm',
					name: 'confirmed',
					message: `A firmware "type=${data.type}" field is not valid because doesn't exist any device with this type `
						+ `thus firmware version not to be uploaded. `
						+ `If you are sure that "type=${data.type}" you've specified is valid, `
						+ `you can override it confirming this question or using --force flag.`,
				});
				if (options.force || !optionsProvided && (await promptOverride()).confirmed) {
					await uploadFirmwareVersion(
						{
							restApi,
							firmware: data,
							pathArr: Array.from(pathSet),
							progressBar: createProgressBar(),
							force: true,
						},
					);
				}
			} else {
				throw error;
			}
		}
	},
});
