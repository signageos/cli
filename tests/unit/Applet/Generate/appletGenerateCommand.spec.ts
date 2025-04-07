import * as should from 'should';
import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';

const baseCommand = 'npx --version && npx ts-node ./src/index.ts applet generate ';
let targetDirs: string[] = [];

const getAbsolutePath = (targetDir: string): string => {
	return path.join(process.cwd(), targetDir);
};

describe.only('unit.appletGenerateCommand', () => {
	describe('generate all Typescript applet flavours', () => {
		it('should generate TS applet with webpack', async () => {
			const targetDir = 'tests/output/webpack';
			targetDirs.push(targetDir);
			const command =
				baseCommand + `--bundler webpack --git no --name webpack --language typescript --target-dir ${getAbsolutePath(targetDir)}`;
			execSync(command, { stdio: 'inherit' });

			should(await fs.pathExists(targetDir)).be.true();
			should(await fs.pathExists(path.join(targetDir, 'webpack.config.js'))).be.true();
		}).timeout(180000);

		it('should generate TS applet with rspack', async () => {
			const targetDir = 'tests/output/rspack';
			targetDirs.push(targetDir);
			const command =
				baseCommand + `--bundler rspack --git no --name rspack --language typescript --target-dir ${getAbsolutePath(targetDir)}`;
			execSync(command, { stdio: 'inherit' });

			should(await fs.pathExists(targetDir)).be.true();
			should(await fs.pathExists(path.join(targetDir, 'rspack.config.mjs'))).be.true();
		}).timeout(180000);
	});

	describe('generate all Javascript applet flavours', () => {
		it('should generate JS applet with webpack', async () => {
			const targetDir = 'tests/output/webpack_js';
			targetDirs.push(targetDir);
			const command =
				baseCommand + `--bundler webpack --git no --name webpack --language javascript --target-dir ${getAbsolutePath(targetDir)}`;
			execSync(command, { stdio: 'inherit' });

			should(await fs.pathExists(targetDir)).be.true();
			should(await fs.pathExists(path.join(targetDir, 'webpack.config.js'))).be.true();
		}).timeout(180000);

		it('should generate JS applet with rspack', async () => {
			const targetDir = 'tests/output/rspack_js';
			targetDirs.push(targetDir);
			const command =
				baseCommand + `--bundler rspack --git no --name rspack --language javascript --target-dir ${getAbsolutePath(targetDir)}`;
			execSync(command, { stdio: 'inherit' });

			should(await fs.pathExists(targetDir)).be.true();
			should(await fs.pathExists(path.join(targetDir, 'rspack.config.mjs'))).be.true();
		}).timeout(180000);
	});

	describe('generate applet and test specific features', () => {
		it('should generate TS applet with webpack and git option', async () => {
			const targetDir = 'tests/output/webpack_git';
			const command =
				baseCommand + `--bundler webpack --git yes --name webpack --language typescript --target-dir ${getAbsolutePath(targetDir)}`;
			execSync(command, { stdio: 'inherit' });

			should(await fs.pathExists(targetDir)).be.true();
			should(await fs.pathExists(path.join(targetDir, 'webpack.config.js'))).be.true();
		}).timeout(180000);

		it('should successfully build all generated sources', async () => {
			console.log('\n\nStarting builds for:', targetDirs);

			for (const targetDir of targetDirs) {
				const rootPath = path.normalize(__dirname + '/../../../../');
				console.log('\n Navigating to', path.join(rootPath, targetDir));
				process.chdir(path.join(rootPath, targetDir));

				const command = `npm run build`;
				execSync(command, { stdio: 'inherit' });
			}
		}).timeout(180000);
	});

	before(async function () {
		this.timeout(180000); // Set timeout to 120 seconds to prevent timeout errors

		// Clean up generated directories before each test
		const outputDir = path.join(process.cwd(), 'tests/output');
		fs.removeSync(outputDir); // Remove the directory if it exists
		fs.ensureDirSync(outputDir); // Ensure the directory is created
	});
});
