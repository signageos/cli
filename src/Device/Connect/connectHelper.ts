
import { networkInterfaces } from "os";
import {
	listDirectoryContentRecursively,
} from "../../FileSystem/helper";
import chalk from "chalk";
import { createDomain } from "../../Emulator/createDomain";
import * as http from 'http';
import * as express from 'express';
import * as cors from "cors";

export async function serveApplet(appletDirectoryPath: string) {
	// await createAppletZip(appletDirectoryPath);
	console.log(`Applet is running at ${chalk.blue(appletDirectoryPath)}`);
	const app = express();
	app.use(cors());
	app.use(express.static('/applet/fbdabe9bba0613c62dba2db6047a49585264851bf7b9518aa9/1.2.0'));

	app.use('/applet/fbdabe9bba0613c62dba2db6047a49585264851bf7b9518aa9/1.2.0/.package.zip', express.static(__dirname + '/package.zip'));
	const server = http.createServer(app);
	server.listen( 8080 , () => {
		console.log(`Applet is running at ${chalk.blue(chalk.bold(createDomain({useLocalIp: true, port: 8080}, server)))}`);
	});
	return {
		stop() {
			server.close();
		},
	};
}

export async function getComputerIp() {
	const protocol: string =  "http://";
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
	return  protocol.concat(machineIps[`en0`][0].concat(":8080"));
}

export async function createAppletZip (
		projectDirectory: string,
) {
	const appletFiles: string[] = [];
	appletFiles.push(...(await listDirectoryContentRecursively(projectDirectory!, "/Users/patrikbily/Dokumety_bezIC/Work/signageos/applet-examples/examples/framework-examples/vue-example/")));

	const AdmZip = require('adm-zip');
	const file = new AdmZip();
	for (let fileAbsolutePath of appletFiles) {
		console.log(`Applet is running at ${chalk.blue(fileAbsolutePath)}`);
		file.addLocalFile(fileAbsolutePath);
	}
	file.writeZip(__dirname + '/package.zip');
	return file;
}
