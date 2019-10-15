import * as webpack from 'webpack';
import * as express from 'express';
import * as path from 'path';
import * as http from 'http';
import * as url from 'url';
import * as fs from 'fs-extra';
import * as serveStatic from 'serve-static';
import chalk from 'chalk';
import Debug from 'debug';
import { loadConfig } from '../RunControl/runControlHelper';
const createDomain = require('webpack-dev-server/lib/utils/createDomain');
const debug = Debug('@signageos/cli:Webpack/Plugin');

// TODO commonjs export
export = Plugin;
class Plugin {

	public apply(compiler: webpack.Compiler) {
		console.log('SOS Plugin started');

		let emulator: IEmulator | undefined;

		compiler.plugin("watch-run", async (_compiler: webpack.Compiler, callback: () => void) => {
			if (!emulator) {
				emulator = await createEmulator();
			}
			callback();
		});

		compiler.plugin("watch-close", async () => {
			if (emulator) {
				emulator.stop();
				emulator = undefined;
			}
		});

		compiler.plugin('done', (stats: webpack.Stats) => {
			if (emulator) {
				emulator.notifyDone(stats);
			}
		});

		process.on('exit', () => {
			if (emulator) {
				emulator.stop();
				emulator = undefined;
			}
		});
	}
}

interface IEmulator {
	notifyDone(stats: webpack.Stats): void;
	stop(): void;
}

async function createEmulator(): Promise<IEmulator | undefined> {
	try {
		const sosWebpackConfig = { ...{ useLocalIp: true, port: 8090 } };

		const projectPath = process.cwd();

		const defaultPort = sosWebpackConfig.port;
		const frontDisplayPath = path.dirname(require.resolve('@signageos/front-display/package.json', { paths: [projectPath]}));
		const frontDisplayDistPath = path.join(frontDisplayPath, 'dist');

		let currentAssets: {
			[filePath: string]: {
				source(): string;
			};
		};
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
		const appletDirectoryPath = '/applet';
		const appletBinaryFileUrl = `${defaultUrl}${appletDirectoryPath}/index.html`;

		app.use(appletDirectoryPath, (req: express.Request, res: express.Response, next: () => void) => {
			const fileUrl = url.parse(req.url);
			const relativeFilePath = path.relative('/', fileUrl.pathname!);
			let prependFileContent = '';

			if (relativeFilePath === 'index.html') {
				// Propagate Hot reload of whole emulator
				prependFileContent = '<script>window.onunload = function () { window.parent.location.reload(); }</script>';
			}

			if (typeof currentAssets[relativeFilePath] !== 'undefined') {
				res.send(prependFileContent + currentAssets[relativeFilePath].source());
			} else {
				next();
			}
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

		return {
			notifyDone(stats: webpack.Stats) {
				try {
					console.log('SOS Applet compilation done');

					envVars = {
						...envVars,
						checksum: stats.compilation.hash,
					};
					debug('process.env', envVars);

					if (typeof stats.compilation.assets['index.html'] === 'undefined') {
						console.warn(`Applet has to have ${chalk.green('index.html')} in output files.`);
						return;
					}
					currentAssets = stats.compilation.assets;
				} catch (error) {
					console.error(error);
					process.exit(1);
				}
			},
			stop() {
				server.close();
			},
		};
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}
