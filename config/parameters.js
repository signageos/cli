
const path = require('path');
const packageConfig = require('../package.json');
const environment = process.env.NODE_ENV || 'dev';
const rootPath = __dirname + path.normalize('/..');
const testsPath = rootPath + '/tests';
const distPath = rootPath + '/dist';

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
	auth: {
		clientId: process.env.SOS_AUTH_CLIENT_ID,
		secret: process.env.SOS_AUTH_SECRET,
	},
};
