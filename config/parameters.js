
const path = require('path');
const dotenv = require('dotenv');
const packageConfig = require('../package.json');
const environment = process.env.NODE_ENV || 'dev';
const rootPath = path.normalize(__dirname + '/..');
const testsPath = rootPath + '/tests';
const distPath = rootPath + '/dist';

dotenv.config({ path: path.join(rootPath, '.env') });

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
};
