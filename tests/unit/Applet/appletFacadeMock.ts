import * as sinon from 'sinon';

export default {
	getAppletVersion: sinon.fake(() => Promise.resolve('fakeAppletVersion')),
	getAppletUid: sinon.fake(() => Promise.resolve('fakeAppletUid')),
	getApplet: sinon.fake(() => Promise.resolve({
		name: 'fakeAppletName',
		version: 'fakeAppletVersion',
	})),
};
