
export default function validateFileExistenceSync(path: string): boolean {
	switch (path) {
		case '/valid.apk':
			return true;
		default:
			return false;
	}
}
