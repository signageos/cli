import * as sinon from 'sinon';
import IApplet from '@signageos/sdk/dist/RestApi/Applet/IApplet';
import Applet from '@signageos/sdk/dist/RestApi/Applet/Applet';

const appletApi = {
	create: sinon.fake(() => Promise.resolve({
		name: 'fakeAppletName',
		uid: 'fakeAppletUid',
		createdAt: new Date(2011, 1, 1, 1, 1),
	} as Applet)),
	get: sinon.fake(() => Promise.resolve({
		name: 'fakeAppletName',
		uid: 'fakeAppletUid',
		createdAt: new Date(2011, 1, 1, 1, 1),
	} as IApplet)),
	version: {
		get: sinon.fake(() => Promise.resolve({ })),
	},
};

const restApi = {
	applet: appletApi,
};

export default {
	createOrganizationRestApi: sinon.fake(() => restApi),
};

export const restApiWithNonExistingAppletVersion = {
	createOrganizationRestApi: sinon.fake(() => ({
		...restApi,
		applet: {
			...appletApi,
			version: {
				get: sinon.fake(() => Promise.reject()),
			},
		},
	})),
};

export const generalOptions = {
	'api-url': undefined,
	'command': undefined,
	'help': undefined,
	'version': undefined,
	'profile': undefined,
} as const;
