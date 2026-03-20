import * as path from 'path';
import * as fs from 'fs-extra';
import should from 'should';
import { useTmpFiles } from '../../lib/tmpFiles';
import {
	getFileMD5Checksum,
	addFrontAppletVersionToConfigFile,
	isPathIncluded,
	getFileType,
	SOS_CONFIG_FILE_NAME,
} from '../../../src/Lib/fileSystem';

describe('Lib.FileSystem', function () {
	const tmpDir = useTmpFiles();

	describe('getFileMD5Checksum', function () {
		it('should calculate checksum of a file', async function () {
			const filePath = path.join(tmpDir, 'file.txt');
			await fs.writeFile(filePath, 'file content');
			const checksum = await getFileMD5Checksum(filePath);
			checksum.should.be.equal('0QtMP/Ejsm3AaNQ6i+8tIw==');
		});
	});

	describe('addFrontAppletVersionToConfigFile', function () {
		it('should add front-applet version to existing config', async function () {
			const config = { name: 'test', version: '1.0.0', platforms: {} };
			const configPath = path.join(tmpDir, SOS_CONFIG_FILE_NAME);
			await fs.writeFile(configPath, JSON.stringify(config, undefined, '\t'));

			await addFrontAppletVersionToConfigFile(tmpDir, '5.0.0');

			const result = JSON.parse(await fs.readFile(configPath, 'utf-8'));
			should(result.sos).be.eql({ '@signageos/front-applet': '5.0.0' });
		});

		it('should preserve existing sos properties', async function () {
			const config = { name: 'test', version: '1.0.0', platforms: {}, sos: { other: 'value' } };
			const configPath = path.join(tmpDir, SOS_CONFIG_FILE_NAME);
			await fs.writeFile(configPath, JSON.stringify(config, undefined, '\t'));

			await addFrontAppletVersionToConfigFile(tmpDir, '5.0.0');

			const result = JSON.parse(await fs.readFile(configPath, 'utf-8'));
			should(result.sos).be.eql({ other: 'value', '@signageos/front-applet': '5.0.0' });
		});

		it('should do nothing if config file does not exist', async function () {
			const nonExistentDir = path.join(tmpDir, 'nonexistent');
			await fs.ensureDir(nonExistentDir);

			await addFrontAppletVersionToConfigFile(nonExistentDir, '5.0.0');

			const exists = await fs.pathExists(path.join(nonExistentDir, SOS_CONFIG_FILE_NAME));
			should(exists).be.false();
		});

		it('should throw descriptive error for invalid JSON', async function () {
			const configPath = path.join(tmpDir, SOS_CONFIG_FILE_NAME);
			await fs.writeFile(configPath, '{ invalid json }');

			await should(addFrontAppletVersionToConfigFile(tmpDir, '5.0.0')).be.rejectedWith(/Invalid JSON in \.sosconfig\.json/);
		});
	});

	describe('getFileType', function () {
		it('should return mime type for a known file', async function () {
			const filePath = path.join(tmpDir, 'test.json');
			await fs.writeFile(filePath, '{}');
			const result = await getFileType(filePath);
			should(result).be.a.String();
		});
	});

	describe('isPathIncluded', function () {
		it('should return true when file is in the list', function () {
			should(isPathIncluded(['/a/b/c.ts', '/d/e.ts'], '/a/b/c.ts')).be.true();
		});

		it('should return false when file is not in the list', function () {
			should(isPathIncluded(['/a/b/c.ts'], '/x/y.ts')).be.false();
		});

		it('should normalize backslashes to forward slashes', function () {
			should(isPathIncluded(['a\\b\\c.ts'], 'a/b/c.ts')).be.true();
		});
	});
});
