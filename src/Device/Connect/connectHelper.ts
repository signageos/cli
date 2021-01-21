
import * as os from "os";
import * as fs from 'fs-extra';
import * as http from 'http';
import * as express from 'express';
import * as cors from "cors";
import * as ini from 'ini';
import * as path from 'path';
import chalk from "chalk";
import { createDomain } from "../../Emulator/createDomain";
import { listDirectoryContentRecursively } from "../../FileSystem/helper";
import { getAppletFileRelativePath } from "../../Applet/Upload/appletUploadFacadeHelper";
import { IApplet } from "../../Applet/appletFacade";
import { networkInterfaces } from "os";
import { disconnectDevice } from "../deviceFacade";
import { IOrganization } from "../../Organization/organizationFacade";
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
		appletData: Partial<IApplet>,
		device: DeviceInfo,
) {
	await createAppletZip(projectDirectory, device.uid);
	const app = express();
	if (!appletData.uid) {
		throw new Error(`Missing appletUid in package.json. Make sure to first upload the applet to box via ${chalk.blue(chalk.bold("sos applet upload"))}`);
	}
	const zipAddress = `/applet/${appletData.uid}/${appletData.version}/.package.zip`;
	app.use(cors());
	app.use((_req, res, next) => {
		res.header('Cache-control', 'no-cache');
		next();
	});
	app.use(zipAddress, express.static(path.join(connectRuntimeDirPath, device.uid, 'package.zip' + `${device.uid}`)));
	const server = http.createServer(app);
	const deviceUlrInBox = `https://${process.env.SOS_BOX_HOST}/device/${device.uid}`;
	server.listen( () => {
		console.log(`Serving applet from ${chalk.blue(chalk.bold(createDomain({useLocalIp: true, port: 8080}, server)))} on ${chalk.magenta(chalk.bold(device.name))} (${chalk.blue(chalk.bold(deviceUlrInBox))})`);
	});
	const serverData = JSON.stringify(server.address());
	const serverPort = JSON.parse(serverData).port;
	return {
		serverPort,
		stop() {
			server.close();
		},
	};
}

export async function getMachineIp() {
	const nets = networkInterfaces(), machineIps = Object.create(null);
	for (const name of Object.keys(nets)) {
		for (const net of nets[name]) {
			if (net.family === 'IPv4' && !net.internal) {
				if (!machineIps[name]) {
					machineIps[name] = [];
				}
				machineIps[name].push(net.address);
			}
		}
	}
	const firsInterface = Object.keys(machineIps)[0];
	return  machineIps[firsInterface][0];
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
		console.log(` ${chalk.blue(chalk.bold("Device was disconnected"))}`);
	});
	await deleteUsedFiles(connectRuntimeDirPath, deviceUid);
	process.exit(0);
}

export async function deleteUsedFiles(temporaryDirPath: string, deviceUid: string) {
	await fs.remove(temporaryDirPath.concat(`/${deviceUid}`));
	await fs.remove(temporaryDirPath.concat('/package.zip' + deviceUid));
	const files = await fs.readdir(connectRuntimeDirPath);
	if (files.length === 0) {
		await fs.remove(connectRuntimeDirPath);
	}
}
