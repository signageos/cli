import * as path from 'path';
import * as fs from 'fs-extra';
import * as unzipper from 'unzipper';
import should from 'should';
import { generateZip } from '../../../src/Lib/archive';
import { useTmpFiles } from '../../lib/tmpFiles';

describe('Lib.Archive', () => {
	describe('generateZip', () => {
		const tmpDir = useTmpFiles();
		const rootDir = 'root';
		const extractedDir = path.join(tmpDir, 'extracted');

		function getOrigFilePath(filePath: string) {
			return path.join(tmpDir, rootDir, filePath);
		}

		it('should generate zip file from files and directories', async () => {
			const dir1 = 'dir1';
			const dir2 = 'dir2';

			const subdir1 = 'dir1/subdir1';

			const file1 = 'file1.txt';
			const file2 = 'file2.txt';
			const file3 = 'dir1/file3.txt';
			const file4 = 'dir1/file4.txt';
			const file5 = 'dir1/subdir1/file5.txt';
			const file6 = 'dir2/file6.txt';
			const file7 = 'dir2/file7.txt';

			// generate files and directories

			await fs.ensureDir(getOrigFilePath(''));

			await fs.writeFile(getOrigFilePath(file1), 'file1 content');
			await fs.writeFile(getOrigFilePath(file2), 'file2 content');

			await fs.ensureDir(getOrigFilePath(dir1));
			await fs.writeFile(getOrigFilePath(file3), 'file3 content');
			await fs.writeFile(getOrigFilePath(file4), 'file4 content');

			await fs.ensureDir(getOrigFilePath(subdir1));
			await fs.writeFile(getOrigFilePath(file5), 'file5 content');

			await fs.ensureDir(getOrigFilePath(dir2));
			await fs.writeFile(getOrigFilePath(file6), 'file6 content');
			await fs.writeFile(getOrigFilePath(file7), 'file7 content');

			// generate archive

			const archivePath = path.join(tmpDir, 'archive.zip');
			await generateZip(tmpDir, rootDir, archivePath);

			// unzip archive and check contents

			await fs.ensureDir(extractedDir);

			const archiveDirectory = await unzipper.Open.file(archivePath);
			await archiveDirectory.extract({ path: extractedDir });

			should(await fs.readFile(path.join(extractedDir, file1), 'utf8')).be.equal('file1 content');
			should(await fs.readFile(path.join(extractedDir, file2), 'utf8')).be.equal('file2 content');
			should(await fs.readFile(path.join(extractedDir, dir1, 'file3.txt'), 'utf8')).be.equal('file3 content');
			should(await fs.readFile(path.join(extractedDir, dir1, 'file4.txt'), 'utf8')).be.equal('file4 content');
			should(await fs.readFile(path.join(extractedDir, subdir1, 'file5.txt'), 'utf8')).be.equal('file5 content');
			should(await fs.readFile(path.join(extractedDir, dir2, 'file6.txt'), 'utf8')).be.equal('file6 content');
			should(await fs.readFile(path.join(extractedDir, dir2, 'file7.txt'), 'utf8')).be.equal('file7 content');
		});
	});
});
