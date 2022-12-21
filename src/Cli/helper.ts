import { parameters } from '../parameters';

export function getPackageName() {
	return parameters.name;
}

export function getPackageVersion() {
	return parameters.version;
}
