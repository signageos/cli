
const path = require('path');
const dotenv = require('dotenv');
const packageConfig = require('../package.json');
const environment = process.env.NODE_ENV || 'dev';
const rootPath = path.normalize(__dirname + '/..');
const testsPath = rootPath + '/tests';
const distPath = rootPath + '/dist';

dotenv.config({ path: path.join(rootPath, '.env') });

const configurableEnvVars = [
	'SOS_PROFILE',
	'SOS_API_IDENTIFICATION',
	'SOS_API_SECURITY_TOKEN',
	'SOS_ORGANIZATION_UID',
	'SOS_APPLET_UID',
	'SOS_APPLET_VERSION',
	'SOS_APPLET_NAME',
] as const;

for (const envVar of configurableEnvVars) {
	if (process.env[envVar]) {
		console.warn(`Environment variable ${envVar} found. Will override default values from ~/.sosrc`);
	}
}

const apiUrl = process.env.SOS_API_URL;
const boxHost = process.env.SOS_BOX_HOST;

if (!apiUrl) {
	throw new Error(`Environment variable SOS_API_URL is required`);
}
if (!boxHost) {
	throw new Error(`Environment variable SOS_BOX_HOST is required`);
}

export const parameters = {
	environment,
	name: packageConfig.name,
	version: packageConfig.version,
	configPath: __dirname,
	paths: {
		rootPath,
		testsPath,
		distPath,
	},
	profile: process.env.SOS_PROFILE,
	apiUrl,
	boxHost,
	applet: {
		uid: process.env.SOS_APPLET_UID,
		version: process.env.SOS_APPLET_VERSION,
		name: process.env.SOS_APPLET_NAME,
	},
	accountAuth: {
		tokenId: process.env.SOS_API_IDENTIFICATION,
		token: process.env.SOS_API_SECURITY_TOKEN,
	},
	defaultOrganizationUid: process.env.SOS_ORGANIZATION_UID,
};
