import chalk from 'chalk';
import { createEmulator } from '../../Emulator/emulatorFactory';
import {
	getAppletEntryFileAbsolutePath,
	getAppletEntryFileRelativePath,
	APPLET_PATH_OPTION,
	ENTRY_FILE_PATH_OPTION,
	getAppletDirectoryAbsolutePath,
} from '../Upload/appletUploadCommandHelper';
import { loadEmulatorOrCreateNewAndReturnUid } from '../../Emulator/emulatorFacade';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { getOrganizationUidOrDefaultOrSelect, NO_DEFAULT_ORGANIZATION_OPTION, ORGANIZATION_UID_OPTION } from '../../Organization/organizationFacade';
import { createDevelopment } from '@signageos/sdk/dist';
import { AppletHotReload } from '@signageos/sdk/dist/Development/Applet/AppletHotReload';
import wait from '../../Timer/wait';
import { SERVER_PORT_OPTION, SERVER_PUBLIC_URL_OPTION } from '../appletServerHelper';
import { log } from '@signageos/sdk/dist/Console/log';

const DEFAULT_PORT = 8090;
const PORT_OPTION = {
	name: 'port',
	type: Number,
	description: `Port where will the applet run`,
	defaultValue: DEFAULT_PORT,
} as const;

const HOT_RELOAD_OPTION = {
	name: 'hot-reload',
	type: Boolean,
	description: `Enable hot reload and build of applet`,
	defaultValue: false,
} as const;

export const OPTION_LIST = [
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
	PORT_OPTION,
	APPLET_PATH_OPTION,
	ENTRY_FILE_PATH_OPTION,
	HOT_RELOAD_OPTION,
	SERVER_PORT_OPTION,
	SERVER_PUBLIC_URL_OPTION,
] as const;

export const appletStart = createCommandDefinition({
	name: 'start',
	description: 'Start applet locally',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const currentDirectory = process.cwd();

		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const entryFileAbsolutePath = await getAppletEntryFileAbsolutePath(currentDirectory, options);
		const appletPath = await getAppletDirectoryAbsolutePath(currentDirectory, options);
		const entryFileRelativePath = getAppletEntryFileRelativePath(entryFileAbsolutePath, appletPath);
		const emulatorUid = await loadEmulatorOrCreateNewAndReturnUid(organizationUid);
		const dev = createDevelopment({
			organizationUid,
		});

		const emulatorServerPort = options[PORT_OPTION.name] ?? DEFAULT_PORT;
		const hotReloadEnabled = options[HOT_RELOAD_OPTION.name];
		const appletPort = options[SERVER_PORT_OPTION.name];
		const appletPublicUrl = options[SERVER_PUBLIC_URL_OPTION.name];

		let appletUid: string | undefined;
		let appletVersion: string | undefined;
		try {
			({ appletUid, appletVersion } = await dev.applet.identification.getAppletUidAndVersion(appletPath));
		} catch (e) {
			log('warning', chalk.yellow('Applet is not uploaded yet. It cannot be developed on real device.'));
		}

		let appletHotReload: AppletHotReload | undefined;

		if (hotReloadEnabled) {
			appletHotReload = await dev.applet.startHotReload({
				appletPath: appletPath,
				port: appletPort,
				publicUrl: appletPublicUrl,
			});
		}

		const createEmulatorParams = {
			emulatorUid,
			appletUid,
			appletVersion,
			appletPath,
			entryFileRelativePath,
			emulatorServerPort,
		};
		const emulator = await createEmulator(createEmulatorParams, organizationUid, dev);

		const stopServer = async () => {
			await appletHotReload?.stop();
			await emulator.stop();
			process.exit();
		};
		process.on('SIGINT', stopServer);
		process.on('SIGTERM', stopServer);

		console.info('Press Ctrl+C to stop');
		await wait(1e9); // Wait forever
	},
});
