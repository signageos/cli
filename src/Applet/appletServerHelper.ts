import { log } from '@signageos/sdk/dist/Console/log';
import { Development } from '@signageos/sdk/dist/Development/Development';
import { CommandLineOptions } from '../Command/commandDefinition';
import { parameters } from '../parameters';

export const SERVER_PUBLIC_URL_OPTION = {
	name: 'server-public-url',
	type: String,
	description: 'Public url of local machine server. Is useful when the local machine is behind a reverse proxy.',
} as const;

export const SERVER_PORT_OPTION = {
	name: 'server-port',
	type: Number,
	description: 'The custom server port for local machine server. Default is detected from currently running applet server.',
} as const;

export const SERVER_FORCE_OPTION = {
	name: 'force',
	type: Boolean,
	description: 'Force start applet server even if it is already running on a different port. Kill the running server first.',
} as const;

export const DETACH_PROCESS_OPTION = {
	name: 'detach',
	type: Boolean,
	description:
		'Detach the applet HTTP server process from the terminal. Useful when want to run more commands reusing the same http server for current applet.',
	defaultValue: false,
} as const;

export const FORWARD_SERVER_URL_OPTION = {
	name: 'forward-server-url',
	type: String,
	description: 'Url of forward server to connect to the device instead of the local network (LAN).',
	defaultValue: parameters.forwardServerUrl,
} as const;

export async function killAppletServerIfRunningAndForceOption(
	dev: Development,
	options: CommandLineOptions<[typeof SERVER_FORCE_OPTION]>,
	appletUid: string | undefined,
	appletVersion: string | undefined,
	appletPort: number | undefined,
) {
	if (!appletUid || !appletVersion) {
		return;
	}

	const force = options[SERVER_FORCE_OPTION.name];

	const runningAppletPort = await dev.applet.serve.getRunningPort(appletUid, appletVersion);
	if (runningAppletPort && runningAppletPort !== appletPort) {
		if (!force) {
			log(
				'warning',
				`Applet server is already running on port ${runningAppletPort}. Use --force to kill the running server and start a new one.`,
			);
		} else {
			await dev.applet.serve.killRunningServer(appletUid, appletVersion);
		}
	}
}
