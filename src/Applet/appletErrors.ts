export class AppletDoesNotExistError extends Error {
	constructor(message: string) {
		super(message);
		Object.setPrototypeOf(this, AppletDoesNotExistError.prototype);
	}
}

export class AppletSelectionCancelledError extends Error {
	constructor(message: string = 'Applet selection was cancelled') {
		super(message);
		Object.setPrototypeOf(this, AppletSelectionCancelledError.prototype);
	}
}
