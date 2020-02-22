
export default function validateFileExistenceSync(path: string): void {
	switch (path) {
		case '/valid.apk':
			break;
		default:
			throw new Error('File is not valid.');
	}
}
