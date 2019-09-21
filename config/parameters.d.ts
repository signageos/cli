
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
};

export = parameters;
