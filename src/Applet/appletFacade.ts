import * as fs from 'fs-extra';
import * as path from 'path';
import { deserializeJSON } from '../helper';

export interface IApplet {
	uid: string;
	name: string;
	version: string;
}

export async function getApplet(directoryPath: string): Promise<Partial<IApplet>> {
	const packageJSONPath = path.join(directoryPath, 'package.json');
	const packageJSONPathExists = await fs.pathExists(packageJSONPath);

	if (!packageJSONPathExists) {
		throw new Error(`No package.json found in: ${packageJSONPath}`);
	}

	const packageJSONRaw = await fs.readFile(packageJSONPath, { encoding: 'utf8' });
	const packageJSONObject = JSON.parse(packageJSONRaw, deserializeJSON);

	const appletUid = packageJSONObject.sos ? packageJSONObject.sos.appletUid : undefined;

	return {
		uid: appletUid,
		name: packageJSONObject.name,
		version: packageJSONObject.version,
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
	const packageJSONPath = path.join(directoryPath, 'package.json');
	const applet = await getApplet(directoryPath);

	if (!applet.version) {
		throw new Error(`No "version" key found in: ${packageJSONPath}`);
	}

	return applet.version;
}

export async function tryGetAppletUid(directoryPath: string): Promise<string | undefined> {
	const applet = await getApplet(directoryPath);

	return applet.uid;
}

export async function getAppletFrontAppletVersion(_directoryPath: string): Promise<string> {
	return ''; // TODO load from package.json when sos platform is supported
}
