import { appletGenerate } from './Generate/appletGenerateCommand';
import { appletUpload } from './Upload/appletUploadCommand';
import { appletStart } from './Start/appletStartCommand';
import { appletTest } from './Test/appletTestCommand';
import { createCommandDefinition } from '../Command/commandDefinition';
import { appletBuild } from './Build/appletBuildCommand';

export const applet = createCommandDefinition({
	name: 'applet',
	description: 'Applet management',
	optionList: [],
	commands: [appletGenerate, appletUpload, appletStart, appletTest, appletBuild],
	async run() {
		throw new Error('Unknown command');
	},
});
