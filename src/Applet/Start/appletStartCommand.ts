import { CommandLineOptions } from "command-line-args";
import ICommand from '../../Command/ICommand';
import { createEmulator } from '../../Emulator/emulatorFactory';
import {
	getAppletEntryFileAbsolutePath,
	getAppletDirectoryAbsolutePath as getProjectDirAbsolutePath,
} from '../Upload/appletUploadCommandHelper';
import { getAppletDirAbsolutePath } from './appletStartCommandHelper';

export const appletStart: ICommand = {
	name: 'start',
	description: 'Start applet locally',
	optionList: [
		{ name: 'port', type: Number, description: `Port where will the applet run`, defaultValue: 8090 },
		{ name: 'applet-dir', type: String, description: 'Directory of the applet to start' },
		{ name: 'project-dir', type: String, description: 'Directory of the applet project' },
	],
	commands: [],
	async run(options: CommandLineOptions) {
		const currentDirectory = process.cwd();

		const emulatorServerPort = options.port;
		const projectDirAbsolutePath = await getProjectDirAbsolutePath(currentDirectory, options);
		const appletDirAbsolutePath = await getAppletDirAbsolutePath(currentDirectory, options);

		await createEmulator({
			appletPath: appletDirAbsolutePath,
			projectPath: projectDirAbsolutePath,
			emulatorServerPort,
		});
	},
};
