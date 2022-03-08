import * as sinon from 'sinon';

export default {
	getOrganizationUidOrDefaultOrSelect: sinon.fake(() => 'fakeOrganizationUid'),
	getAppletBinaryFileAbsolutePath: sinon.fake(() => 'fakeBinaryFileAbsolutePath'),
	getAppletDirectoryAbsolutePath: sinon.fake(() => 'fakeDirectoryAbsolutePath'),
	getAppletEntryFileAbsolutePath: sinon.fake(() => 'fakeEntryFileAbsolutePath'),
	getAppletEntryFileRelativePath: sinon.fake(() => 'fakeEntryFileRelativePath'),
	saveToPackage: sinon.fake(),
};
