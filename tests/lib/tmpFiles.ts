/* eslint-disable mocha/no-exports, mocha/no-top-level-hooks */
import * as fs from 'fs-extra';

/**
 * Use tmp files in tests
 *
 * Use when tests need to create files
 *
 * @returns Path to the tmp directory
 */
export function useTmpFiles() {
	const TMP_DIR = 'tmp';

	before('ensure tmp directory', async function () {
		await fs.ensureDir(TMP_DIR);
	});

	after('remove tmp directory', async function () {
		await fs.remove(TMP_DIR);
	});

	return TMP_DIR;
}
