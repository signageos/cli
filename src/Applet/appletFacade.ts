import * as path from 'path';
import * as prompts from 'prompts';
import RestApi from "@signageos/sdk/dist/RestApi/RestApi";
import ISdkApplet from '@signageos/sdk/dist/RestApi/Applet/IApplet';
import * as parameters from '../../config/parameters';
import { loadPackage } from '../FileSystem/packageConfig';

export interface IApplet {
	uid: string;
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

	if (!appletUid) {
		throw new Error(`No "sos.appletUid" key found in: ${packageJSONPath} nor SOS_APPLET_UID environment variable specified`);
	}
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
	const packageJSONPath = path.join(directoryPath, 'package.json');
	const applet = await getApplet(directoryPath);

	if (!applet.name) {
		throw new Error(`No "name" key found in: ${packageJSONPath}`);
	}

	return applet.name;
}

export async function getAppletVersion(directoryPath: string): Promise<string> {
	const packageJSONObject = await loadPackage(directoryPath) ?? {};

	if (!packageJSONObject.version) {
		const packageJSONPath = path.join(directoryPath, 'package.json');
		throw new Error(`No "version" key found in: ${packageJSONPath}`);
	}

	return packageJSONObject.version;
}

export async function tryGetAppletUid(directoryPath: string): Promise<string | undefined> {
	const applet = await getApplet(directoryPath);

	return applet.uid;
}

export async function getAppletFrontAppletVersion(_directoryPath: string): Promise<string> {
	return ''; // TODO load from package.json when sos platform is supported
}
export async function getAppletUid(
	restApi: RestApi,
) {
	const currentDirectory = process.cwd();
	let appletUid: string | undefined = await tryGetAppletUid(currentDirectory);

	if (!appletUid) {
		const applets = await restApi.applet.list();
		const response = await prompts({
			type: 'autocomplete',
			name: 'appletUid',
			message: `Select applet to use`,
			choices: applets.map((applet: ISdkApplet) => ({
				title: `${applet.name} (${applet.uid})`,
				value: applet.uid,
			})),
		});
		appletUid = response.appletUid;
	}
	if (!appletUid) {
		throw new Error('Missing argument --applet-uid <string>');
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
