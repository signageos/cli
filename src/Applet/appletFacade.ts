import * as path from 'path';
import prompts from 'prompts';
import chalk from 'chalk';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import ISdkApplet from '@signageos/sdk/dist/RestApi/Applet/IApplet';
import { parameters } from '../parameters';
import { loadPackage } from '@signageos/sdk/dist/FileSystem/packageConfig';
import { CommandLineOptions } from '../Command/commandDefinition';
import { AppletDoesNotExistError } from './appletErrors';

export interface IApplet {
	uid?: string;
	name: string;
	version: string;
	/** @deprecated Used only for single-file applets as backward compatibility. */
	frontAppletVersion?: string;
}

export const APPLET_UID_OPTION = { name: 'applet-uid', type: String, description: 'Applet UID' } as const;

export async function getApplet(directoryPath: string): Promise<IApplet> {
	const packageJSONPath = path.join(directoryPath, 'package.json');
	const packageJSONObject = await loadPackage(directoryPath);
	if (!packageJSONObject) {
		throw new Error(`No package.json found in: ${packageJSONPath}`);
	}

	const appletUid = parameters.applet.uid ?? packageJSONObject.sos?.appletUid;
	const appletVersion = parameters.applet.version ?? packageJSONObject.version;
	const appletName = parameters.applet.name ?? packageJSONObject.name;
	const frontAppletVersion =
		packageJSONObject.sos?.dependencies?.['@signageos/front-applet'] ??
		packageJSONObject.dependencies?.['@signageos/front-applet'] ??
		packageJSONObject.devDependencies?.['@signageos/front-applet'] ??
		'';

	if (!appletVersion) {
		throw new Error(`No "version" key found in: ${packageJSONPath} nor SOS_APPLET_VERSION environment variable specified`);
	}
	if (!appletName) {
		throw new Error(`No "name" key found in: ${packageJSONPath} nor SOS_APPLET_NAME environment variable specified`);
	}

	return {
		uid: appletUid,
		name: appletName,
		version: appletVersion,
		frontAppletVersion,
	};
}

export async function getAppletVersion(directoryPath: string): Promise<string> {
	const applet = await getApplet(directoryPath);
	return applet.version;
}

export async function getAppletUid(restApi: RestApi, options: CommandLineOptions<[typeof APPLET_UID_OPTION]>) {
	const currentDirectory = process.cwd();
	const currentApplet = await getApplet(currentDirectory);

	let appletUid: string | undefined = options['applet-uid'] || currentApplet.uid;

	if (!appletUid) {
		const applets = await restApi.applet.list();
		const candidatesOfApplets = applets.filter((applet) => applet.name === currentApplet.name);
		if (candidatesOfApplets.length === 0) {
			appletUid = undefined;
		} else if (candidatesOfApplets.length > 1) {
			const response = await prompts({
				type: 'autocomplete',
				name: 'appletUid',
				message: `Select applet to use`,
				choices: candidatesOfApplets.map((applet: ISdkApplet) => ({
					title: `${applet.name} (${applet.uid})`,
					value: applet.uid,
				})),
			});
			appletUid = response.appletUid;
		} else {
			appletUid = candidatesOfApplets[0]?.uid;
		}
	}
	if (!appletUid) {
		throw new AppletDoesNotExistError(
			`Applet does not exist. Please use ${chalk.green('sos applet upload')} first or specify --applet-uid argument.`,
		);
	}

	return appletUid;
}

export async function getAppletVersionFromApi(restApi: RestApi, appletUid: string) {
	let appletVersion: string;

	const appletVersions = await restApi.applet.version.list(appletUid);
	if (appletVersions.length === 1 && appletVersions[0]?.version) {
		appletVersion = appletVersions[0].version;
	} else {
		const response = await prompts({
			type: 'autocomplete',
			name: 'appletVersion',
			message: `Select applet version to use`,
			choices: appletVersions.map((applet) => ({
				title: applet.version,
				value: applet.version,
			})),
		});
		appletVersion = response.appletVersion;
	}

	return appletVersion;
}
