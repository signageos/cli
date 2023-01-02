import { log } from '@signageos/sdk/dist/Console/log';
import chalk from 'chalk';
import { APPLET_UID_OPTION, getAppletUid, getAppletVersionFromApi } from '../../Applet/appletFacade';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { createOrganizationRestApi } from '../../helper';
import {
	getOrganization,
	getOrganizationUidOrDefaultOrSelect,
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
} from '../../Organization/organizationFacade';
import { DEVICE_UID_OPTION, getDeviceUid } from '../deviceFacade';

const OPTION_LIST = [
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
	APPLET_UID_OPTION,
	DEVICE_UID_OPTION,
] as const;

export const setContent = createCommandDefinition({
	name: 'set-content',
	description: 'Set content for device',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const organization = await getOrganization(organizationUid);
		const restApi = await createOrganizationRestApi(organization);
		const appletUid = await getAppletUid(restApi, options);
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
		log('info', chalk.green(`Applet ${appletUid} was set on device ${deviceUid}`));
	},
});
