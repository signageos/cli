import * as path from 'path';
import * as http from 'http';
import * as url from 'url';
import * as express from 'express';
import * as cors from 'cors';
import * as serveStatic from 'serve-static';
import * as mime from 'mime';
import * as fs from 'fs-extra';
import * as glob from 'globby';
import chalk from 'chalk';
import { IEmulator } from './IEmulator';
import { loadConfig } from '../RunControl/runControlHelper';
const createDomain = require('webpack-dev-server/lib/utils/createDomain');

export interface ICreateEmulatorParams {
	projectPath: string;
	appletPath: string;
	emulatorServerPort: number;
}

export async function createEmulator(params: ICreateEmulatorParams): Promise<IEmulator> {
	const { projectPath, emulatorServerPort, appletPath } = params;

	const serverDomainOptions = { useLocalIp: true, port: emulatorServerPort };
	const frontDisplayPath = path.dirname(require.resolve('@signageos/front-display/package.json', { paths: [projectPath]}));
	const frontDisplayDistPath = path.join(frontDisplayPath, 'dist');

	let envVars = {};

	const app = express();

	app.use(cors());

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
	server.listen(emulatorServerPort, () => {
		console.log(`Applet is running at ${chalk.blue(chalk.bold(createDomain(serverDomainOptions, server)))}`);
	});

	const serverUrl: string = createDomain(serverDomainOptions, server);
	const appletResourcePath = '/applet';
	const appletBinaryFileUrl = `${serverUrl}${appletResourcePath}/index.html`;
	const appletAssets = await glob(
		['**/*'],
		{
			cwd: appletPath,
			absolute: true,
			dot: true,
		},
	);

	app.use(appletResourcePath, (req: express.Request, res: express.Response, next: () => void) => {
		const fileUrl = url.parse(req.url);
		const relativeFilePath = fileUrl.pathname ? fileUrl.pathname.substr(1) : '';
		const assetPath = appletAssets.find((asset: string) => {
			return asset.substring(appletPath.length + 1) === relativeFilePath;
		});

		if (assetPath) {
			const contentType = mime.getType(relativeFilePath) || 'application/octet-stream';
			res.setHeader('Content-Type', contentType);
			const readStream = fs.createReadStream(assetPath);
			readStream.pipe(res);
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
		checksum: 'ASDFGHJKL1234567890',
		organizationUid,
	};

	return {
		stop() {
			server.close();
		},
	};
}
