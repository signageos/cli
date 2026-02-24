import * as sinon from 'sinon';

export default {
	isValidAppletDirectory: sinon.fake(() => true),
	validateAppletDirectory: sinon.fake(() => Promise.resolve()),
};
