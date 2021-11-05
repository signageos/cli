
const path = require('path');
const dotenv = require('dotenv');
const packageConfig = require('../package.json');
const environment = process.env.NODE_ENV || 'dev';
const rootPath = path.normalize(__dirname + '/..');
const testsPath = rootPath + '/tests';
const distPath = rootPath + '/dist';

dotenv.config({ path: path.join(rootPath, '.env') });

if (process.env.SOS_API_IDENTIFICATION) {
	console.warn(`Environment variable SOS_API_IDENTIFICATION found. Will override default credentials from ~/.sosrc`);
}

if (process.env.SOS_API_SECURITY_TOKEN) {
	console.warn(`Environment variable SOS_API_SECURITY_TOKEN found. Will override default credentials from ~/.sosrc`);
}

if (process.env.SOS_ORGANIZATION_UID) {
	console.warn(`Environment variable SOS_ORGANIZATION_UID found. Will override default credentials from ~/.sosrc`);
}

module.exports = {
	environment,
	name: packageConfig.name,
	version: packageConfig.version,
	configPath: __dirname,
	paths: {
		rootPath,
		testsPath,
		distPath,
	},
	apiUrl: process.env.SOS_API_URL,
	boxHost: process.env.SOS_BOX_HOST,
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
