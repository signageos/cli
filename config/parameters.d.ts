
declare const parameters: {
    environment: 'dev' | 'production';
	version: string;
	configPath: string;
	paths: {
		rootPath: string;
		testsPath: string;
		distPath: string;
	},
    apiUrl: string;
	boxHost: string;
	auth: {
		clientId: string | undefined;
		secret: string | undefined;
	},
};

export = parameters;
