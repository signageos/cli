import * as sinon from 'sinon';

export default {
	getAppletName: sinon.fake(() => Promise.resolve('fakeAppletName')),
	getAppletVersion: sinon.fake(() => Promise.resolve('fakeAppletVersion')),
	getAppletUid: sinon.fake(() => Promise.resolve('fakeAppletUid')),
};
