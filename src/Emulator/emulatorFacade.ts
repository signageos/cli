import * as chalk from 'chalk';
import * as prompts from 'prompts';
import { loadConfig, updateConfig, IConfig } from '../RunControl/runControlHelper';
import { getGlobalApiUrl } from '../Command/commandProcessor';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import AuthenitcationError from '@signageos/sdk/dist/RestApi/Error/AuthenticationError';

interface IEmulatorData {
	uid: string;
	duid: string;
	name: string;
	createdAt: Date;
}

const createRestApi = (config: IConfig) => {
	const options = {
		url: getGlobalApiUrl(),
		auth: {
			clientId: config.identification ?? '',
			secret: config.apiSecurityToken ?? '',
		},
		version: 'v1' as 'v1',
	};
	return new RestApi(options, options);
};

async function getListOfEmulators(restApi: RestApi) {
	try {
		return await restApi.emulator.list();
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

export async function loadEmulatorOrCreateNewAndReturnUid() {
	const config = await loadConfig();
	if (!config.identification || !config.apiSecurityToken) {
		throw new Error(`No authenticized account found. Try to login using ${chalk.green('sos login')}`);
	}
	if (!config.defaultOrganizationUid) {
		throw new Error(`No default organization selected. Use ${chalk.green('sos organization set-default')} first.`);
	}
	const restApi = createRestApi(config);
	const listOfEmulatorsResponse = await getListOfEmulators(restApi);
	const isSavedValidEmulator = config.emulatorUid && listOfEmulatorsResponse.some(
		(emu: IEmulatorData) => emu.duid === config.emulatorUid,
	);

	if (isSavedValidEmulator) {
		return config.emulatorUid as string;
	} else if (config.emulatorUid) {
		console.log(chalk.yellow('Field emulatorUid in sos config links to non existent emulator'));
	}
	let emulatorUid: string = '';
	console.log('Looking for valid emulator assigned to your account via API...');
	if (listOfEmulatorsResponse.length === 1) {
		const emulatorName = listOfEmulatorsResponse[0].name;
		emulatorUid = listOfEmulatorsResponse[0].duid;
		console.log(`One valid emulator ${chalk.green(emulatorName)} fetched and saved into .sosrc`);

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
		console.log('No valid emulator assigned to your account found via API thus newone will be created');
		await createNewEmulator(restApi, config.defaultOrganizationUid);
		const newEmulatorList = await getListOfEmulators(restApi);
		const emulatorName = newEmulatorList[0].name;
		emulatorUid = newEmulatorList[0].duid;
		console.log(`New emulator ${chalk.green(emulatorName)} created and saved into .sosrc`);
	}
	await updateConfig({ emulatorUid });
	return emulatorUid;
}
