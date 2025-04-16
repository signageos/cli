import * as path from 'path';
import * as fs from 'fs-extra';
import archiver from 'archiver';

/**
 * Generate zip archive from a list of files and directories
 *
 * @param workDir Absolute path to current working directory
 * @param rootDir Relative path from the working directory to the root directory that should be archived
 * @param outputPath Path to the output zip archive
 */
export async function generateZip(workDir: string, rootDir: string, outputPath: string) {
	const output = fs.createWriteStream(outputPath);

	const outputPromise = new Promise<void>((resolve, reject) => {
		output.on('close', resolve);
		output.on('error', reject);
	});

	const archive = archiver('zip', {
		zlib: { level: 9 },
	});

	archive.pipe(output);

	const fileFullPath = path.join(workDir, rootDir);
	const stat = await fs.stat(fileFullPath);

	if (!stat.isDirectory()) {
		throw new Error(`${rootDir} is not a directory`);
	}

	archive.directory(fileFullPath, false);

	await archive.finalize();
	await outputPromise;
}
