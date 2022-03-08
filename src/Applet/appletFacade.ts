import * as path from 'path';
import * as prompts from 'prompts';
import RestApi from "@signageos/sdk/dist/RestApi/RestApi";
import ISdkApplet from '@signageos/sdk/dist/RestApi/Applet/IApplet';
import * as parameters from '../../config/parameters';
import { loadPackage } from '../FileSystem/packageConfig';

export interface IApplet {
	uid?: string;
	name: string;
	version: string;
}

export async function getApplet(directoryPath: string): Promise<IApplet> {
	const packageJSONPath = path.join(directoryPath, 'package.json');
	const packageJSONObject = await loadPackage(directoryPath);
	if (!packageJSONObject) {
		throw new Error(`No package.json found in: ${packageJSONPath}`);
	}

	const appletUid = parameters.applet.uid ?? packageJSONObject.sos?.appletUid;
	const appletVersion = parameters.applet.version ?? packageJSONObject.version;
	const appletName = parameters.applet.name ?? packageJSONObject.name;

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
	};
}

export async function getAppletName(directoryPath: string): Promise<string> {
	const applet = await getApplet(directoryPath);
	return applet.name;
}

export async function getAppletVersion(directoryPath: string): Promise<string> {
	const applet = await getApplet(directoryPath);
	return applet.version;
}

export async function getAppletUid(
	restApi: RestApi,
) {
	const currentDirectory = process.cwd();
	const currentApplet = await getApplet(currentDirectory);

	let appletUid: string | undefined = currentApplet.uid;

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
			appletUid = candidatesOfApplets[0].uid;
		}
	}
	return appletUid;
}

export async function getAppletVersionFromApi(
		restApi: RestApi,
		appletUid: string,
) {
	let appletVersion: string;

	const appletVersions = await restApi.applet.version.list(appletUid);
	if (appletVersions.length === 1) {
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
