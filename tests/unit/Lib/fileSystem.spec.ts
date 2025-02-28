import * as path from 'path';
import * as fs from 'fs-extra';
import { useTmpFiles } from '../../lib/tmpFiles';
import { getFileMD5Checksum } from '../../../src/Lib/fileSystem';

describe('Lib.FileSystem', () => {
	const tmpDir = useTmpFiles();

	describe('getFileMD5Checksum', () => {
		it('should calculate checksum of a file', async () => {
			const filePath = path.join(tmpDir, 'file.txt');
			await fs.writeFile(filePath, 'file content');
			const checksum = await getFileMD5Checksum(filePath);
			checksum.should.be.equal('0QtMP/Ejsm3AaNQ6i+8tIw==');
		});
	});
});
