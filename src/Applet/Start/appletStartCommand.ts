import { createEmulator } from '../../Emulator/emulatorFactory';
import {
	getAppletEntryFileAbsolutePath,
	getAppletDirectoryAbsolutePath as getProjectDirAbsolutePath,
	getAppletEntryFileRelativePath,
	APPLET_PATH_OPTION,
	ENTRY_FILE_PATH_OPTION,
} from '../Upload/appletUploadCommandHelper';
import { getAppletDirAbsolutePath } from './appletStartCommandHelper';
import { loadEmulatorOrCreateNewAndReturnUid } from '../../Emulator/emulatorFacade';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { getOrganizationUidOrDefaultOrSelect, NO_DEFAULT_ORGANIZATION_OPTION, ORGANIZATION_UID_OPTION } from '../../Organization/organizationFacade';

export const OPTION_LIST = [
	NO_DEFAULT_ORGANIZATION_OPTION,
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
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const emulatorServerPort = options.port;
		const entryFileAbsolutePath = await getAppletEntryFileAbsolutePath(currentDirectory, options);
		const projectDirAbsolutePath = await getProjectDirAbsolutePath(currentDirectory, options);
		const appletDirAbsolutePath = await getAppletDirAbsolutePath(currentDirectory, options);
		const entryFileRelativePath = getAppletEntryFileRelativePath(entryFileAbsolutePath, appletDirAbsolutePath);
		const emulatorUid = await loadEmulatorOrCreateNewAndReturnUid(organizationUid);

		const createEmulatorParams = {
			emulatorUid,
			appletPath: appletDirAbsolutePath,
			projectPath: projectDirAbsolutePath,
			entryFileRelativePath,
			emulatorServerPort,
		};
		await createEmulator(createEmulatorParams, organizationUid);
	},
});
