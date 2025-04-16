import chalk from 'chalk';
import prompts from 'prompts';
import { loadConfig, updateConfig } from '../RunControl/runControlHelper';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import AuthenitcationError from '@signageos/sdk/dist/RestApi/Error/AuthenticationError';
import { ApiVersions } from '@signageos/sdk/dist/RestApi/apiVersions';
import { createClientVersions, getApiUrl } from '../helper';
import { log } from '@signageos/sdk/dist/Console/log';
import { IConfig } from '@signageos/sdk/dist/SosHelper/sosControlHelper';

interface IEmulatorData {
	uid: string;
	duid: string;
	name: string;
	createdAt: Date;
}

const createRestApi = (config: IConfig) => {
	const options = {
		url: getApiUrl(config),
		auth: {
			clientId: config.identification ?? '',
			secret: config.apiSecurityToken ?? '',
		},
		version: ApiVersions.V1,
		clientVersions: createClientVersions(),
	};
	return new RestApi(options, options);
};

async function getListOfEmulators(restApi: RestApi, organizationUid: string) {
	try {
		return await restApi.emulator.list({ organizationUid });
	} catch (e) {
		if (e instanceof AuthenitcationError) {
			throw new Error(`Authentication error. Try to login using ${chalk.green('sos login')}`);
		} else {
			throw new Error('Unknown error: ' + e.message);
		}
	}
}

async function createNewEmulator(restApi: RestApi, organizationUid: string) {
	try {
		return await restApi.emulator.create({ organizationUid });
	} catch (e) {
		throw new Error('Unknown error: ' + e.message);
	}
}

export async function loadEmulatorOrCreateNewAndReturnUid(organizationUid: string) {
	const config = await loadConfig();
	if (!config.identification || !config.apiSecurityToken) {
		throw new Error(`No authenticized account found. Try to login using ${chalk.green('sos login')}`);
	}
	const restApi = createRestApi(config);
	const listOfEmulatorsResponse = await getListOfEmulators(restApi, organizationUid);
	const isSavedValidEmulator = config.emulatorUid && listOfEmulatorsResponse.some((emu: IEmulatorData) => emu.duid === config.emulatorUid);

	if (isSavedValidEmulator) {
		return config.emulatorUid as string;
	} else if (config.emulatorUid) {
		log('warning', chalk.yellow('Field emulatorUid in sos config links to non existent emulator'));
	}
	let emulatorUid: string = '';
	log('info', 'Looking for valid emulator assigned to your account via API...');
	if (listOfEmulatorsResponse.length === 1) {
		const emulatorName = listOfEmulatorsResponse[0].name;
		emulatorUid = listOfEmulatorsResponse[0].duid;
		log('info', `One valid emulator ${chalk.green(emulatorName)} fetched and saved into .sosrc`);
	} else if (listOfEmulatorsResponse.length > 1) {
		const selectedEmulator = await prompts({
			type: 'select',
			name: 'duid',
			message: 'Select emulator to use',
			choices: listOfEmulatorsResponse.map((emu: IEmulatorData) => ({
				title: `${emu.name} (${emu.duid})`,
				value: emu.duid,
			})),
		});
		emulatorUid = selectedEmulator.duid;
	} else {
		log('warning', 'No valid emulator assigned to your account found via API thus newone will be created');
		await createNewEmulator(restApi, organizationUid);
		const newEmulatorList = await getListOfEmulators(restApi, organizationUid);
		const emulatorName = newEmulatorList[0].name;
		emulatorUid = newEmulatorList[0].duid;
		log('info', `New emulator ${chalk.green(emulatorName)} created and saved into .sosrc`);
	}
	await updateConfig({ emulatorUid });
	return emulatorUid;
}
