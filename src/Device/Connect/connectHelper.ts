
import * as os from "os";
import * as fs from 'fs-extra';
import * as http from 'http';
import * as express from 'express';
import * as cors from "cors";
import * as ini from 'ini';
import * as path from 'path';
import chalk from "chalk";
import { listDirectoryContentRecursively } from "../../FileSystem/helper";
import { getAppletFileRelativePath } from "../../Applet/Upload/appletUploadFacadeHelper";
import { disconnectDevice } from "../deviceFacade";
import { IOrganization } from "../../Organization/organizationFacade";
import { parameters } from '../../parameters';
import { log } from "@signageos/sdk/dist/Console/log";
import { getMachineIp } from "../../Helper/localMachineHelper";
const archiver = require('archiver');

const CONNECT_DIRECTORY = 'signageos';
const connectRuntimeDirPath = path.join(os.tmpdir(), CONNECT_DIRECTORY);

export interface IConnect {
	deviceUid?: string;
}

export interface DeviceInfo {
	name: string;
	uid: string;
}

export async function serveApplet(
	projectDirectory: string,
	appletUid: string,
	appletVersion: string,
	device: DeviceInfo,
	serverPort: number | undefined,
	serverPublicUrl: string | undefined,
) {
	await createAppletZip(projectDirectory, device.uid);
	const app = express();
	const zipAddress = `/applet/${appletUid}/${appletVersion}-:appletVersionPostfix/.package.zip`;
	app.use(cors());
	app.use((_req, res, next) => {
		res.header('Cache-control', 'no-cache');
		next();
	});
	app.use(zipAddress, express.static(path.join(connectRuntimeDirPath, device.uid, 'package.zip' + `${device.uid}`)));
	const server = http.createServer(app);
	const deviceUlrInBox = `https://${parameters.boxHost}/device/${device.uid}`;
	const serverRemoteAddr = getMachineIp();
	const serverAddress = server.address();
	const finalServerPort = serverPort ?? (serverAddress && typeof serverAddress === 'object' ? serverAddress.port : 8080);
	const finalServerPublicUrl = serverPublicUrl ?? `http://${serverRemoteAddr}:${finalServerPort}`;
	server.listen(finalServerPort, () => {
		log('info', `Serving applet from ${chalk.blue(chalk.bold(finalServerPublicUrl))} on ${chalk.magenta(chalk.bold(device.name))} (${chalk.blue(chalk.bold(deviceUlrInBox))})`);
	});
	return {
		serverPort: finalServerPort,
		serverRemoteAddr,
		serverPublicUrl: finalServerPublicUrl,
		stop() {
			server.close();
		},
	};
}

export async function createAppletZip (
		projectDirectory: string,
		deviceUid: string,
) {
	const appletFiles: string[] = [];
	const gitIgnorePath = projectDirectory;
	appletFiles.push(...(await listDirectoryContentRecursively(projectDirectory, gitIgnorePath)));

	const archive = archiver('zip');
	const deviceConnectDir = path.join(connectRuntimeDirPath, deviceUid);
	const output = fs.createWriteStream(path.join(deviceConnectDir, "package.zip" + `${deviceUid}`));
	archive.pipe(output);
	for (const fileAbsolutePath of appletFiles) {
		const fileRelativePath = getAppletFileRelativePath(fileAbsolutePath, projectDirectory);
		archive.file(fileRelativePath, {name: fileRelativePath});
	}
	archive.finalize();
	return archive;
}

export async function createConnectFile(deviceUid: string) {
	const deviceConnectDir = path.join(connectRuntimeDirPath, deviceUid);
	await fs.ensureDir(path.join(connectRuntimeDirPath, deviceUid));
	const fileName = path.join(deviceConnectDir, deviceUid);
	const fileContent = ini.encode({deviceUid: deviceUid});
	await fs.ensureDir(connectRuntimeDirPath);

	await fs.writeFile(fileName, fileContent, {
		mode: 0o600,
	});
}

export async function stopApplication(organization: IOrganization, deviceUid: string)  {
	await disconnectDevice(organization, deviceUid).finally(() => {
		log('info', ` ${chalk.blue(chalk.bold("Device was disconnected"))}`);
	});
	await deleteUsedFiles(connectRuntimeDirPath, deviceUid);
	process.exit(0);
}

export async function deleteUsedFiles(temporaryDirPath: string, deviceUid: string) {
	await fs.remove(path.join(temporaryDirPath, deviceUid));
	await fs.remove(path.join(temporaryDirPath, "/package.zip", deviceUid));
	const files = await fs.readdir(connectRuntimeDirPath);
	if (files.length === 0) {
		await fs.remove(connectRuntimeDirPath);
	}
}
