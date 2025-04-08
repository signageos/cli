import * as should from 'should';
import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';

const baseCommand = 'npx ts-node ./src/index.ts applet generate ';
let targetDirs: string[] = [];

const getAbsolutePath = (targetDir: string): string => {
	return path.join(process.cwd(), targetDir);
};

describe('unit.appletGenerateCommand', () => {
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
		it('should generate applet with git option', async () => {
			const targetDir = 'tests/output/rspack_git';
			const command =
				baseCommand + `--bundler rspack --git yes --name rspack --language typescript --target-dir ${getAbsolutePath(targetDir)}`;
			execSync(command, { stdio: 'inherit' });

			should(await fs.pathExists(targetDir)).be.true();
			should(await fs.pathExists(path.join(targetDir, '.gitignore'))).be.true();
		}).timeout(180000);

		it('should successfully build all generated sources', async () => {
			console.log('\n\nStarting builds for:', targetDirs);
			for (const workDir of targetDirs) {
				// Use path.resolve to ensure the rootPath is always correct
				const rootPath = path.resolve(__dirname, '../../../../');
				const absoluteWorkDir = path.join(rootPath, workDir);

				console.log('\n Navigating to', absoluteWorkDir);
				process.chdir(absoluteWorkDir);

				const command = `npm run build`;
				try {
					execSync(command, { stdio: 'inherit' });
				} catch (error) {
					console.error('Build failed for:', absoluteWorkDir);
					console.error('Error message:', error.message);
					if (error.stderr) {
						console.error('Error output:', error.stderr.toString());
					}
					if (error.stdout) {
						console.error('Standard output:', error.stdout.toString());
					}
					throw error; // Ensure the test fails if the build fails
				}
			}
		}).timeout(240000);
	});

	before(async function () {
		this.timeout(180000); // Timeout to prevent timeout errors

		// Clean up generated directories before each test
		const outputDir = path.join(process.cwd(), './tests/output');
		fs.removeSync(outputDir); // Remove the directory if it exists
		fs.ensureDirSync(outputDir); // Ensure the directory is created
	});
});
