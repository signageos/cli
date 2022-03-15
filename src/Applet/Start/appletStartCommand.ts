import { createEmulator } from '../../Emulator/emulatorFactory';
import { APPLET_PATH_OPTION, ENTRY_FILE_PATH_OPTION } from '../Upload/appletUploadCommand';
import {
	getAppletEntryFileAbsolutePath,
	getAppletDirectoryAbsolutePath as getProjectDirAbsolutePath,
	getAppletEntryFileRelativePath,
} from '../Upload/appletUploadCommandHelper';
import { getAppletDirAbsolutePath } from './appletStartCommandHelper';
import { loadEmulatorOrCreateNewAndReturnUid } from '../../Emulator/emulatorFacade';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { GENERAL_OPTION_LIST } from '../../generalCommand';
import { ORGANIZATION_UID_OPTION } from '../../Organization/organizationFacade';

export const OPTION_LIST = [
	...GENERAL_OPTION_LIST,
	ORGANIZATION_UID_OPTION,
	{ name: 'port', type: Number, description: `Port where will the applet run`, defaultValue: 8090 },
	APPLET_PATH_OPTION,
	{ name: 'project-dir', type: String, description: 'Directory of the applet project' },
	ENTRY_FILE_PATH_OPTION,
] as const;

export const appletStart = createCommandDefinition({
	name: 'start',
	description: 'Start applet locally',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const currentDirectory = process.cwd();

		if (!options.port) {
			throw new Error('Argument --port is required');
		}
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
});
