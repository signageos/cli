import * as sinon from 'sinon';

export default {
	listDirectoryContentRecursively: sinon.fake(() => Promise.resolve(['fakePath1', 'fakePath2'])),
};
