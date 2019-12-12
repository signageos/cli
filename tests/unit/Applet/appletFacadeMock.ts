import * as sinon from 'sinon';

export default {
	getAppletName: sinon.fake(() => Promise.resolve('fakeAppletName')),
	getAppletVersion: sinon.fake(() => Promise.resolve('fakeAppletVersion')),
	getAppletFrontAppletVersion: sinon.fake(() => Promise.resolve('fakeAppletFrontVersion')),
	tryGetAppletUid: sinon.fake(() => Promise.resolve('fakeAppletUid')),
};
