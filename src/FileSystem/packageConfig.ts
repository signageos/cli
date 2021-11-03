
export interface ISosPackageConfig {
	appletUid?: string;
}

export interface IPackageConfig {
	name: string;
	version?: string;
	sos?: ISosPackageConfig;
}
