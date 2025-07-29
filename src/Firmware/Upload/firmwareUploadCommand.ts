import { createFirmwareVersionRestApi } from '../../helper';
import prompts from 'prompts';
import chalk from 'chalk';
import { IFirmwareVersionCreatable } from '@signageos/sdk/dist/RestApi/Firmware/Version/IFirmwareVersion';
import { uploadFirmwareVersion } from './firmwareUploadFacade';
import { createProgressBar } from '../../CommandLine/progressBarFactory';
import validateFileExistenceSync from './firmwareUploadHelper';
import RequestError from '@signageos/sdk/dist/RestApi/Error/RequestError';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { log } from '@signageos/sdk/dist/Console/log';

const questions = [
	{
		type: 'text' as const,
		name: 'applicationType',
		message: `Application type`,
	},
	{
		type: 'text' as const,
		name: 'version',
		message: `Firmware version`,
	},
];
const fwTypeQuestion = [
	{
		type: 'text' as const,
		name: 'firmwareType',
		message: `Model prefixed with brand. E.g.: "benq_sl550", "rpi4", "rpi"`,
	},
];
const applicationTypesRequiringType = ['linux', 'android'];

const OPTION_LIST = [
	{ name: 'application-type', alias: 'a', type: String, description: 'Application type for the firmware (e.g., linux, android, webos)' },
	{ name: 'firmware-version', alias: 'f', type: String, description: 'Version identifier for the firmware package' },
	{ name: 'firmware-type', type: String, description: 'Device model prefixed with brand (e.g., "benq_sl550", "rpi4", "rpi")' },
	{ name: 'src', type: String, multiple: true, description: 'Path(s) to firmware file(s) to upload' },
	{ name: 'force', type: Boolean, description: 'When firmware cannot be uploaded due to invalid firmware "type", do it anyways.' },
] as const;

/**
 * Uploads firmware files for specific device types and application platforms.
 * Supports various device architectures including Linux, Android, WebOS, and others.
 * The command validates firmware files and creates versioned firmware packages
 * that can be deployed to compatible devices.
 *
 * @group Private
 *
 * @example
 * ```bash
 * # Upload firmware interactively
 * sos firmware upload
 *
 * # Upload firmware with command line options
 * sos firmware upload --application-type linux --firmware-version 1.2.3 --src /path/to/firmware.tar.gz
 *
 * # Upload Android firmware with type specification
 * sos firmware upload --application-type android --firmware-type rpi4 --firmware-version 1.0.0 --src /path/to/firmware.apk
 *
 * # Force upload when type validation fails
 * sos firmware upload --application-type linux --firmware-type custom_device --firmware-version 1.0.0 --src /path/to/firmware.tar.gz --force
 * ```
 *
 * @throws {Error} When required parameters are missing
 * @throws {Error} When firmware files cannot be found or validated
 * @throws {RequestError} When firmware type is invalid for the platform
 * @throws {Error} When upload confirmation is denied
 *
 * @see {@link ../ Firmware upload command}
 *
 * @see {@link ../../ Firmware management commands}
 *
 * @since 0.6.0
 */
export const firmwareUpload = createCommandDefinition({
	name: 'upload',
	description: 'Upload firmware version to the signageOS platform',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const optionsProvided = !!(options['application-type'] && options['firmware-version'] && options.src && options.src.length > 0);
		const restApi = await createFirmwareVersionRestApi();
		const data: IFirmwareVersionCreatable = {
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
					log('error', `You must input firmware type`);
					return;
				}
			}

			if (!data.applicationType || !data.version) {
				log('error', `You must input application type and version`);
				return;
			}
			while (true) {
				// ask for files
				const answer = await prompts({
					type: 'text',
					name: 'fileFsPath',
					message: 'Absolute path to the file, type `stop` to stop.',
				});
				if (answer.fileFsPath === undefined || answer.fileFsPath === 'stop') {
					// EOF or stop
					break;
				}
				const path = answer.fileFsPath;
				try {
					validateFileExistenceSync(path);
					pathSet.add(path);
					log('info', `${chalk.green('File added to upload list')}`);
				} catch (e: any) {
					log('error', e.message);
				}
			}

			if (pathSet.size > 0) {
				log('info', 'Application type: ', chalk.green(data.applicationType));
				log('info', 'Version: ', chalk.green(data.version));
				if (data.type) {
					log('info', 'Firmware type: ', chalk.green(data.type));
				}
				log('info', 'List of files: ', ...Array.from(pathSet));

				const confirmation = await prompts({
					type: 'confirm',
					name: 'confirmed',
					message: 'Is this ok?',
				});
				if (!confirmation.confirmed) {
					throw new Error(`You must confirm your action.`);
				}
			}
		} else {
			// data is given cli args
			if (!options['application-type']) {
				throw new Error('Argument --application-type is required');
			}
			if (!options['firmware-version']) {
				throw new Error('Argument --firmware-version is required');
			}
			data.applicationType = options['application-type'];
			data.version = options['firmware-version'];
			if (applicationTypesRequiringType.includes(data.applicationType) && !options['firmware-type']) {
				log('error', 'You must input firmware type');
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
			await uploadFirmwareVersion({
				restApi,
				firmware: data,
				pathArr: Array.from(pathSet),
				progressBar: createProgressBar(),
			});
		} catch (error) {
			if (error instanceof RequestError && error.errorName === 'INVALID_TYPE_TO_FIRMWARE_VERSION_UPLOAD') {
				const promptOverride = () =>
					prompts({
						type: 'confirm',
						name: 'confirmed',
						message:
							`A firmware "type=${data.type}" field is not valid because doesn't exist any device with this type ` +
							`thus firmware version not to be uploaded. ` +
							`If you are sure that "type=${data.type}" you've specified is valid, ` +
							`you can override it confirming this question or using --force flag.`,
					});
				if (options.force || (!optionsProvided && (await promptOverride()).confirmed)) {
					await uploadFirmwareVersion({
						restApi,
						firmware: data,
						pathArr: Array.from(pathSet),
						progressBar: createProgressBar(),
						force: true,
					});
				}
			} else {
				throw error;
			}
		}
	},
});
