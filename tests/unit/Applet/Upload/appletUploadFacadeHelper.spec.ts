import should from 'should';
import { getAppletFileRelativePath } from '../../../../src/Applet/Upload/appletUploadFacadeHelper';

describe('unit.appletUploadFacadeHelper', () => {
	describe('getAppletFileRelativePath', () => {
		it('should return relative file path', async () => {
			const actualRelativePath = await getAppletFileRelativePath('/path/file.js', '/path');

			should.deepEqual(actualRelativePath, 'file.js');
		});

		it('should fail if file in not in the dir', async () => {
			let failed = false;
			try {
				await getAppletFileRelativePath('/path/file.js', '/path/path');
			} catch {
				failed = true;
			}

			should.deepEqual(failed, true);
		});

		it('should fail if file path is relative', async () => {
			let failed = false;
			try {
				await getAppletFileRelativePath('path/file.js', '/path');
			} catch {
				failed = true;
			}

			should.deepEqual(failed, true);
		});

		it('should fail if dir path is relative', async () => {
			let failed = false;
			try {
				await getAppletFileRelativePath('/path/file.js', 'path');
			} catch {
				failed = true;
			}

			should.deepEqual(failed, true);
		});

		it('should fail if dir and file path is relative', async () => {
			let failed = false;
			try {
				await getAppletFileRelativePath('path/file.js', 'path');
			} catch {
				failed = true;
			}

			should.deepEqual(failed, true);
		});
	});
});
