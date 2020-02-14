import * as fs from 'fs-extra';

export default function validateFileExistenceSync(path: string): boolean {
	let fileExists = true;
	if (fs.existsSync(path)) {
		const stats = fs.statSync(path);
		if (!stats.isFile()) {
			fileExists = false;
		}
	} else {
		fileExists = false;
	}
	return fileExists;
}
