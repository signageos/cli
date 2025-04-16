import * as path from 'path';
import * as http from 'http';
import * as url from 'url';
import express from 'express';
import cors from 'cors';
import serveStatic from 'serve-static';
import mime from 'mime';
import * as fsExtra from 'fs-extra';
import chalk from 'chalk';
import { IEmulator } from './IEmulator';
import { log } from '@signageos/sdk/dist/Console/log';
import { Development } from '@signageos/sdk/dist/Development/Development';
import { isPathIncluded } from '../Lib/fileSystem';

export interface ICreateEmulatorParams {
	appletUid: string | undefined;
	appletVersion: string | undefined;
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

export async function createEmulator(params: ICreateEmulatorParams, organizationUid: string, dev: Development): Promise<IEmulator> {
	const { appletUid, appletVersion, emulatorServerPort, appletPath, entryFileRelativePath } = params;
	const entryFileAbsolutePath = path.join(appletPath, entryFileRelativePath);

	const frontDisplayPath = path.dirname(require.resolve('@signageos/front-display/package.json', { paths: [appletPath] }));
	const frontDisplayDistPath = path.join(frontDisplayPath, 'dist');

	if (!organizationUid) {
		throw new Error(`No default organization selected. Use ${chalk.green('sos organization set-default')} first.`);
	}

	const envVars: IEnvVars = {
		uid: appletUid || '__default_timing__',
		version: appletVersion || '0.0.0',
		organizationUid,
		binaryFilePath: `${APPLET_DIRECTORY_PATH}/${entryFileRelativePath}`,
		checksum: DUMMY_CHECKSUM,
		frontAppletVersion: '', // has bundled front applet
		frontAppletBinaryFile: '', // has bundled front applet
	};

	const app = express();

	app.use(cors());

	app.get('/', (req: express.Request, res: express.Response) => {
		if (!req.query.duid) {
			res.redirect(`${req.originalUrl}${req.originalUrl.includes('?') ? '&' : '?'}duid=${params.emulatorUid}`);
		} else {
			const page = fsExtra.readFileSync(path.join(frontDisplayDistPath, 'index.html')).toString();
			const script = `
<script>
	window.__SOS_BUNDLED_APPLET = {};
	window.__SOS_BUNDLED_APPLET.binaryFile = location.origin + ${JSON.stringify(envVars.binaryFilePath)};
	window.__SOS_BUNDLED_APPLET.uid = ${JSON.stringify(envVars.uid)};
	window.__SOS_BUNDLED_APPLET.version = ${JSON.stringify(envVars.version)};
	window.__SOS_BUNDLED_APPLET.checksum = ${JSON.stringify(envVars.checksum)};
	window.__SOS_BUNDLED_APPLET.frontAppletVersion = ${JSON.stringify(envVars.frontAppletVersion)};
	window.__SOS_BUNDLED_APPLET.frontAppletBinaryFile = ${JSON.stringify(envVars.frontAppletBinaryFile)};
	window.__SOS_AUTO_VERIFICATION = {};
	window.__SOS_AUTO_VERIFICATION.organizationUid = ${JSON.stringify(envVars.organizationUid)};
</script>`;

			res.send(page.replace('</head>', `${script}</head>`));
		}
	});
	app.use(serveStatic(frontDisplayDistPath));

	const server = http.createServer(app);
	server.listen(emulatorServerPort, () => {
		const emulatorUrl = `http://localhost:${emulatorServerPort}`;
		log('info', `Emulator is running at ${chalk.blue(chalk.bold(emulatorUrl))}`);
	});

	app.use(APPLET_DIRECTORY_PATH, async (req: express.Request, res: express.Response) => {
		const fileUrl = url.parse(req.url);
		const relativeFilePath = fileUrl.pathname ? fileUrl.pathname.substring(1) : '';
		const absoluteFilePath = path.join(appletPath, relativeFilePath);

		const appletFilePaths = await dev.applet.files.listAppletFiles({
			appletPath,
		});

		if (!isPathIncluded(appletFilePaths, absoluteFilePath)) {
			res.status(404).send(`File "${relativeFilePath}" was not found`);
			return;
		}

		if (relativeFilePath === entryFileRelativePath) {
			// Propagate Hot reload of whole emulator
			const prependFileContent =
				'<script>window.onbeforeunload = function () { window.parent.postMessage({ type: "hug.applet_refresh" }, "*") }</script>';
			res.setHeader('Content-Type', 'text/html');
			const page = await fsExtra.readFile(entryFileAbsolutePath, 'utf8');
			res.send(page.replace('</head>', `${prependFileContent}</head>`));
			return;
		}

		const contentType = mime.getType(absoluteFilePath) || 'application/octet-stream';
		res.setHeader('Content-Type', contentType);
		const readStream = fsExtra.createReadStream(absoluteFilePath);
		readStream.pipe(res);
	});

	return {
		async stop() {
			await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
		},
	};
}
