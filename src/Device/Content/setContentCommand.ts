import chalk from 'chalk';
import { getAppletUid, getAppletVersionFromApi } from '../../Applet/appletFacade';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { createOrganizationRestApi } from '../../helper';
import { getOrganization, getOrganizationUidOrDefaultOrSelect, NO_DEFAULT_ORGANIZATION_OPTION, ORGANIZATION_UID_OPTION } from '../../Organization/organizationFacade';
import { getDeviceUid } from '../deviceFacade';

const OPTION_LIST = [
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
	{ name: 'applet-uid', type: String, description: 'Uid of applet form box' },
	{ name: 'device-uid', type: String, description: 'Uid of device from box' },
] as const;

export const setContent = createCommandDefinition({
	name: 'set-content',
	description: 'Set content for device',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const organization = await getOrganization(organizationUid);
		const restApi = createOrganizationRestApi(organization);
		const appletUid = await getAppletUid(restApi);
		if (!appletUid) {
			throw new Error('Missing argument --applet-uid <string>');
		}
		const appletVersion  = await getAppletVersionFromApi(restApi, appletUid);
		const deviceUid = await getDeviceUid(restApi, options);
		await restApi.timing.create({
			deviceUid : deviceUid,
			appletUid: appletUid,
			appletVersion: appletVersion,
			startsAt: new Date(),
			endsAt: new Date(),
			position: 1,
			configuration: {
				identification: "Deploy from CLI ",
			},
			finishEvent: {
				type: 'DURATION',
				data: "1000",
			},
		});
		console.log(chalk.green(`Applet ${appletUid} was set on device ${deviceUid}`));
	},
});
