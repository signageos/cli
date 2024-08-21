import * as fs from 'fs-extra';
import * as path from 'path';

export async function validateTestFiles(currentDirectory: string, testFiles: string[]) {
	for (const testFile of testFiles) {
		const testFilePath = path.join(currentDirectory, testFile);
		if (!(await fs.pathExists(testFilePath))) {
			throw new Error(`Test file ${testFilePath} specified in package.json sos.tests doesn't exist`);
		}
	}
}

export async function loadTestFilesContents(currentDirectory: string, testFiles: string[]) {
	const contentsMap: { [identifier: string]: string } = {};
	await Promise.all(
		testFiles.map(async (testFile) => {
			const testFilePath = path.join(currentDirectory, testFile);
			const buffer = await fs.readFile(testFilePath);
			contentsMap[testFile] = buffer.toString();
		}),
	);
	return contentsMap;
}
