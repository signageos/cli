import * as fs from 'fs-extra';
import * as path from 'path';
import { deserializeJSON } from '../helper';
import * as _ from 'lodash';

type IDependencies = {
	['@signageos/front-applet']: string;
	[packageName: string]: string;
};

export interface ISosPackageConfig {
	appletUid?: string;
	tests?: string[];
	/** @deprecated Used only for single-file applets as backward compatibility. */
	dependencies?: IDependencies;
}

export interface IPackageConfig {
	name: string;
	version: string;
	sos?: ISosPackageConfig;
	main: string;
	files?: string[];
	dependencies?: IDependencies;
	devDependencies?: IDependencies;
}

export async function saveToPackage(currentDirectory: string, data: Partial<IPackageConfig>) {
	const previousContent = await loadPackage(currentDirectory) ?? {};
	const packageJSONPath = path.join(currentDirectory, 'package.json');
	const newContent = _.merge({}, previousContent, data);
	await fs.writeFile(packageJSONPath, JSON.stringify(newContent, undefined, 2) + '\n');
}

export async function loadPackage(currentDirectory: string): Promise<Partial<IPackageConfig> | null> {
	const packageJSONPath = path.join(currentDirectory, 'package.json');
	const packageJSONPathExists = await fs.pathExists(packageJSONPath);

	if (!packageJSONPathExists) {
		return null;
	}

	const packageRaw = await fs.readFile(packageJSONPath, { encoding: 'utf8' });
	return JSON.parse(packageRaw, deserializeJSON);
}
