import * as sinon from 'sinon';
import {
	DEFAULT_APPLET_BINARY_FILE_PATH,
	ENTRY_FILE_PATH_OPTION,
	DEFAULT_APPLET_DIR_PATH,
	DEFAULT_APPLET_ENTRY_FILE_PATH,
} from '../../../../src/Applet/Upload/appletUploadCommandHelper';

export default {
	DEFAULT_APPLET_DIR_PATH,
	DEFAULT_APPLET_ENTRY_FILE_PATH,
	DEFAULT_APPLET_BINARY_FILE_PATH,
	ENTRY_FILE_PATH_OPTION,
	getAppletBinaryFileAbsolutePath: sinon.fake(() => 'fakeBinaryFileAbsolutePath'),
	getAppletDirectoryAbsolutePath: sinon.fake(() => 'fakeDirectoryAbsolutePath'),
	getAppletEntryFileAbsolutePath: sinon.fake(() => 'fakeEntryFileAbsolutePath'),
	getAppletEntryFileRelativePath: sinon.fake(() => 'fakeEntryFileRelativePath'),
	saveToPackage: sinon.fake(),
};
