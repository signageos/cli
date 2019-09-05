
const path = require('path');
const packageConfig = require('../package.json');
const environment = process.env.NODE_ENV || 'dev';
const rootPath = path.normalize(__dirname + '/..');
const testsPath = rootPath + '/tests';
const distPath = rootPath + '/dist';

require('dotenv').config(rootPath);
require('dotenv').config();

module.exports = {
	environment,
	version: packageConfig.version,
	configPath: __dirname,
	paths: {
		rootPath,
		testsPath,
		distPath,
	},
	apiUrl: process.env.SOS_API_URL,
	boxHost: process.env.SOS_BOX_HOST,
	auth: {
		clientId: process.env.SOS_AUTH_CLIENT_ID,
		secret: process.env.SOS_AUTH_SECRET,
	},
};
