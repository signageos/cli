import * as webpack from 'webpack';
import * as express from 'express';
import * as path from 'path';
import * as http from 'http';
import * as fs from 'fs-extra';
import * as serveStatic from 'serve-static';
import chalk from 'chalk';
import { loadConfig } from '../RunControl/runControlHelper';
const createDomain = require('webpack-dev-server/lib/utils/createDomain');

export default class Plugin {

	public async apply(compiler: webpack.Compiler) {
		try {
			console.log('SOS Plugin started');

			const sosWebpackConfig = { ...{ useLocalIp: true, port: 8090 } };

			const projectPath = process.cwd();

			const defaultPort = sosWebpackConfig.port;
			const frontDisplayPath = path.dirname(require.resolve('@signageos/front-display/package.json', { paths: [projectPath]}));
			const frontDisplayDistPath = path.join(frontDisplayPath, 'dist');

			let currentIndexHtml: string | undefined;
			let envVars = {};

			const app = express();
			app.get('/display.appcache', (_req: express.Request, res: express.Response) => {
				const currentDate = new Date();
				res.header('Last-Modified', currentDate.toString());
				res.header('Content-type', 'text/cache-manifest; charset=UTF-8');
				res.send(`CACHE MANIFEST\n# v1 - ${currentDate.toISOString()}\n/tmp\nNETWORK:\n*\n`);
			});
			app.get('/', (_req: express.Request, res: express.Response) => {
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

			app.get(appletBinaryFilePath, (_req: express.Request, res: express.Response) => {
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

			compiler.plugin('done', async (stats: webpack.Stats) => {
				try {
					console.log('SOS Applet compilation done');

					envVars = {
						...envVars,
						checksum: stats.compilation.hash,
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
	}
}
