import * as path from 'path';
import * as http from 'http';
import * as url from 'url';
import * as express from 'express';
import * as cors from 'cors';
import * as serveStatic from 'serve-static';
import * as mime from 'mime';
import * as fsExtra from 'fs-extra';
import * as glob from 'globby';
import chalk from 'chalk';
import { IEmulator } from './IEmulator';
import { createDomain } from './createDomain';
import { getOrganizationUidOrDefaultOrSelect, NO_DEFAULT_ORGANIZATION_OPTION, ORGANIZATION_UID_OPTION } from '../Organization/organizationFacade';
import { CommandLineOptions } from '../Command/commandDefinition';

export interface ICreateEmulatorParams {
	projectPath: string;
	appletPath: string;
	entryFileRelativePath: string;
	emulatorServerPort: number;
	emulatorUid: string;
}

const DUMMY_CHECKSUM = '0000000000ffffffffff';
const APPLET_DIRECTORY_PATH = '/applet';

type IEnvVars = {
	frontAppletVersion: string;
	frontAppletBinaryFile: string;
	uid: string;
	version: string;
	binaryFilePath: string;
	organizationUid: string;
	checksum: string;
};

export async function createEmulator(
	params: ICreateEmulatorParams,
	options: CommandLineOptions<[typeof ORGANIZATION_UID_OPTION, typeof NO_DEFAULT_ORGANIZATION_OPTION]>,
): Promise<IEmulator> {
	const { projectPath, emulatorServerPort, appletPath, entryFileRelativePath } = params;
	const entryFileAbsolutePath = path.join(appletPath, entryFileRelativePath);

	const serverDomainOptions = { useLocalIp: true, port: emulatorServerPort };
	const frontDisplayPath = path.dirname(require.resolve('@signageos/front-display/package.json', { paths: [projectPath]}));
	const frontDisplayDistPath = path.join(frontDisplayPath, 'dist');

	const packageConfig = JSON.parse(fsExtra.readFileSync(path.join(projectPath, 'package.json')).toString());

	const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);

	if (!organizationUid) {
		throw new Error(`No default organization selected. Use ${chalk.green('sos organization set-default')} first.`);
	}

	const envVars: IEnvVars = {
		uid: packageConfig.sos?.appletUid || '__default_timing__',
		version: packageConfig.version,
		organizationUid,
		binaryFilePath: `${APPLET_DIRECTORY_PATH}/${entryFileRelativePath}`,
		checksum: DUMMY_CHECKSUM,
		frontAppletVersion: '', // has bundled front applet
		frontAppletBinaryFile: '', // has bundled front applet
	};

	const app = express();

	app.use(cors());

	app.get('/display.appcache', (_req: express.Request, res: express.Response) => {
		const currentDate = new Date();
		res.header('Last-Modified', currentDate.toString());
		res.header('Content-type', 'text/cache-manifest; charset=UTF-8');
		res.send(`CACHE MANIFEST\n# v1 - ${currentDate.toISOString()}\n/tmp\nNETWORK:\n*\n`);
	});
	app.get('/', (req: express.Request, res: express.Response) => {
		if (!req.query.duid) {
			res.redirect(`${req.originalUrl}${req.originalUrl.includes('?') ? '&' : '?'}duid=${params.emulatorUid}`);
		} else {
			res.send(
				`<script>
					window.__SOS_BUNDLED_APPLET = {};
					window.__SOS_BUNDLED_APPLET.binaryFile = location.origin + ${JSON.stringify(envVars.binaryFilePath)};
					window.__SOS_BUNDLED_APPLET.uid = ${JSON.stringify(envVars.uid)};
					window.__SOS_BUNDLED_APPLET.version = ${JSON.stringify(envVars.version)};
					window.__SOS_BUNDLED_APPLET.checksum = ${JSON.stringify(envVars.checksum)};
					window.__SOS_BUNDLED_APPLET.frontAppletVersion = ${JSON.stringify(envVars.frontAppletVersion)};
					window.__SOS_BUNDLED_APPLET.frontAppletBinaryFile = ${JSON.stringify(envVars.frontAppletBinaryFile)};
					window.__SOS_AUTO_VERIFICATION = {};
					window.__SOS_AUTO_VERIFICATION.organizationUid = ${JSON.stringify(envVars.organizationUid)};
				</script>`
				+ fsExtra.readFileSync(path.join(frontDisplayDistPath, 'index.html')).toString(),
			);
		}
	});
	app.use(serveStatic(frontDisplayDistPath));

	const server = http.createServer(app);
	server.listen(emulatorServerPort, () => {
		console.log(`Emulator is running at ${chalk.blue(chalk.bold(createDomain(serverDomainOptions, server)))}`);
	});

	const appletAssets = await glob(
		['**/*'],
		{
			cwd: appletPath,
			absolute: true,
			dot: true,
		},
	);

	const entryFileExists = appletAssets.includes(entryFileAbsolutePath.replace(/\\/g, '/'));
	if (!entryFileExists) {
		throw new Error(`Applet has to have ${chalk.green(entryFileRelativePath)} in applet directory.`);
	}

	app.use(APPLET_DIRECTORY_PATH, (req: express.Request, res: express.Response, next: () => void) => {
		const fileUrl = url.parse(req.url);
		const relativeFilePath = fileUrl.pathname ? fileUrl.pathname.substr(1) : '';
		const assetPath = appletAssets.find((asset: string) => {
			return asset.substring(appletPath.length + 1) === relativeFilePath;
		});

		if (assetPath) {
			const contentType = mime.getType(relativeFilePath) || 'application/octet-stream';
			res.setHeader('Content-Type', contentType);
			const readStream = fsExtra.createReadStream(assetPath);
			readStream.pipe(res);
		} else {
			next();
		}
	});

	return {
		stop() {
			server.close();
		},
	};
}
