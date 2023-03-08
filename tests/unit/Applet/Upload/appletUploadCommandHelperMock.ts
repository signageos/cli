import * as sinon from 'sinon';
import {
	ENTRY_FILE_PATH_OPTION,
} from '../../../../src/Applet/Upload/appletUploadCommandHelper';

export default {
	ENTRY_FILE_PATH_OPTION,
	getAppletBinaryFileAbsolutePath: sinon.fake(() => 'fakeBinaryFileAbsolutePath'),
	getAppletDirectoryAbsolutePath: sinon.fake(() => 'fakeDirectoryAbsolutePath'),
	getAppletEntryFileAbsolutePath: sinon.fake(() => 'fakeEntryFileAbsolutePath'),
	getAppletEntryFileRelativePath: sinon.fake(() => 'fakeEntryFileRelativePath'),
	saveToPackage: sinon.fake(),
};
