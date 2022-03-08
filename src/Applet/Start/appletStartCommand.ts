import { CommandLineOptions } from "command-line-args";
import ICommand from '../../Command/ICommand';
import { createEmulator } from '../../Emulator/emulatorFactory';
import { ENTRY_FILE_PATH_OPTION } from '../Upload/appletUploadCommand';
import {
	getAppletEntryFileAbsolutePath,
	getAppletDirectoryAbsolutePath as getProjectDirAbsolutePath,
	getAppletEntryFileRelativePath,
} from '../Upload/appletUploadCommandHelper';
import { getAppletDirAbsolutePath } from './appletStartCommandHelper';
import { loadEmulatorOrCreateNewAndReturnUid } from '../../Emulator/emulatorFacade';

export const appletStart: ICommand = {
	name: 'start',
	description: 'Start applet locally',
	optionList: [
		{ name: 'port', type: Number, description: `Port where will the applet run`, defaultValue: 8090 },
		{ name: 'applet-dir', type: String, description: 'Directory of the applet to start' },
		{ name: 'project-dir', type: String, description: 'Directory of the applet project' },
		ENTRY_FILE_PATH_OPTION,
	],
	commands: [],
	async run(options: CommandLineOptions) {
		const currentDirectory = process.cwd();

		const emulatorServerPort = options.port;
		const entryFileAbsolutePath = await getAppletEntryFileAbsolutePath(currentDirectory, options);
		const projectDirAbsolutePath = await getProjectDirAbsolutePath(currentDirectory, options);
		const appletDirAbsolutePath = await getAppletDirAbsolutePath(currentDirectory, options);
		const entryFileRelativePath = await getAppletEntryFileRelativePath(entryFileAbsolutePath, appletDirAbsolutePath);
		const emulatorUid = await loadEmulatorOrCreateNewAndReturnUid(options);

		const createEmulatorParams = {
			emulatorUid,
			appletPath: appletDirAbsolutePath,
			projectPath: projectDirAbsolutePath,
			entryFileRelativePath,
			emulatorServerPort,
		};
		await createEmulator(createEmulatorParams, options);
	},
};
