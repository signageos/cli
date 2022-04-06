
declare const parameters: {
    environment: 'dev' | 'production';
	name: string;
	version: string;
	configPath: string;
	paths: {
		rootPath: string;
		testsPath: string;
		distPath: string;
	},
	profile: string | undefined;
    apiUrl: string;
	boxHost: string;
	applet: {
		uid: string | undefined;
		version: string | undefined;
		name: string | undefined;
	};
	accountAuth: {
		tokenId: string | undefined;
		token: string | undefined;
	};
	defaultOrganizationUid: string | undefined;
};

export = parameters;
