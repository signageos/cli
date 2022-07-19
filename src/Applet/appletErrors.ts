export class AppletDoesNotExistError extends Error {
	constructor(message: string) {
		super(message);
		Object.setPrototypeOf(this, AppletDoesNotExistError.prototype);
	}
}
