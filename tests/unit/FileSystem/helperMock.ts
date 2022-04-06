import * as sinon from 'sinon';

export default {
	listDirectoryContentRecursively: sinon.fake(() => Promise.resolve(['fakePath1', 'fakePath2'])),
	validateAllFormalities: sinon.fake((_appletDir: string, _entryFile: string) => Promise.resolve(void 0)),
};
