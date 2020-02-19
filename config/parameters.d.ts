
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
    apiUrl: string;
	boxHost: string;
};

export = parameters;
