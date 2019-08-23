const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')

exports = module.exports = {
	entry: "./src/index.js",
	output: {
		filename: 'index.js',
	},
	resolve: {
		extensions: [".js"],
	},
	module: {
		rules: [
			{
				test: /^(.(?!.module.css))*.css$/,
				use: ['style-loader', 'css-loader'],
			},
		],
	},
	plugins: [
			new HtmlWebpackPlugin({
				template: 'public/index.html',
				inlineSource: '.(js|css)$', // embed all javascript and css inline
			}),
			new HtmlWebpackInlineSourcePlugin(),
			{ apply: async (compiler) => {
				try {
					console.log('SOS Plugin started');
	
					const sosWebpackConfig = { ...compiler.options.sos || {}, ...{ useLocalIp: true, port: 8090 } };
	
					const projectPath = process.cwd();
					const path = require('path');
					const http = require('http');
					const fs = require('fs-extra');
					const express = require('express');
					const serveStatic = require('serve-static');
					const chalk = require('chalk');
					const createDomain = require('webpack-dev-server/lib/utils/createDomain');
					const { loadConfig } = require('../dist/RunControl/runControlHelper'); // TODO @signageos/cli
	
					const defaultPort = sosWebpackConfig.port;
					const frontDisplayPath = path.dirname(require.resolve('@signageos/front-display/package.json'));
					const frontDisplayDistPath = path.join(frontDisplayPath, 'dist');
					
					let currentIndexHtml;
					let envVars = {};
	
					const app = express();
					app.get('/display.appcache', (_req, res) => {
						res.header('Last-Modified', new Date().toString());
						res.header('Content-type', 'text/cache-manifest; charset=UTF-8');
						res.send(`CACHE MANIFEST\n# v1 - ${new Date().toISOString()}\n/tmp\nNETWORK:\n*\n`);
					});
					app.get('/', (_req, res) => {
						res.send(
							`<script>window.__SOS_BUNDLED_APPLET = ${JSON.stringify(envVars)}</script>`
							+ `<script>window.__SOS_AUTO_VERIFICATION = ${JSON.stringify(envVars)}</script>`
							+ fs.readFileSync(path.join(frontDisplayDistPath, 'index.html')).toString(),
						);
					});
					app.use(serveStatic(frontDisplayDistPath));
	
					const server = http.createServer(app);
					server.listen(defaultPort, () => {
						console.log(`Emulator is running at ${chalk.blue(chalk.bold(createDomain(sosWebpackConfig, server)))}`);
					});
	
					const defaultUrl = createDomain(sosWebpackConfig, server);
					const appletBinaryFilePath = '/applet.html';
					const appletBinaryFileUrl = `${defaultUrl}${appletBinaryFilePath}`;
	
					app.get(appletBinaryFilePath, (_req, res) => {
						res.send(currentIndexHtml);
					});
	
					const packageConfig = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json')).toString());
					const sosGlobalConfig = await loadConfig();
					const organizationUid = sosGlobalConfig.defaultOrganizationUid;
	
					if (!organizationUid) {
						throw new Error(`No default organization selected. Use ${chalk.green('sos organization set-default')} first.`);
					}
	
					envVars = {
						version: packageConfig.version,
						binaryFile: appletBinaryFileUrl,
						frontAppletVersion: '', // has bundled front applet
						frontAppletBinaryFile: '', // has bundled front applet
						organizationUid,
					};
	
					compiler.plugin('done', async (stats) => {
						try {
							console.log('SOS Applet compilation done');
	
							envVars = {
								...envVars,
								checksum: stats.compilation.fullHash,
							};
							console.log('process.env', envVars);
	
							if (typeof stats.compilation.assets['index.html'] === 'undefined') {
								console.warn(`Applet has to have ${chalk.green('index.html')} in output files. Use ${chalk.green('HtmlWebpackPlugin')}!`);
								return;
							}
							currentIndexHtml = stats.compilation.assets['index.html'].source();
						} catch (error) {
							console.error(error);
							process.exit(1);
						}
					});
				} catch (error) {
					console.error(error);
					process.exit(1);
				}
			} },
	],
};
