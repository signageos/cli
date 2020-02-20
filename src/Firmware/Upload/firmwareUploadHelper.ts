import * as fs from 'fs-extra';

export default function validateFileExistenceSync(path: string): void {
	if (fs.existsSync(path)) {
		const stats = fs.statSync(path);
		if (!stats.isFile()) {
			throw new Error(`${path} is not file.`);
		}
	} else {
		throw new Error(`${path} does not exist.`);
	}
}
