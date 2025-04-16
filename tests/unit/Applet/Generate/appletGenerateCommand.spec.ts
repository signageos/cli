import should from 'should';
import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import which from 'which';

// Use path.resolve to ensure the rootPath is always correct
const rootPath = path.resolve(__dirname, '../../../../');
const outputDir = path.join(process.cwd(), './tests/output');

const baseCommand = 'npx ts-node ./src/index.ts applet generate ';

const getAbsolutePath = (targetDir: string): string => {
	return path.join(process.cwd(), targetDir);
};

const checkPackage = async (packageName: string) => {
	return await which(packageName, { nothrow: false });
};

const goToTarget = (workDir: string) => {
	process.chdir(path.join(rootPath, workDir));
	console.log('Current working directory:', process.cwd());
};

const buildApplet = async (workDir: string, command: string) => {
	const absoluteWorkDir = path.join(rootPath, workDir);
	console.log('\n Navigating to', absoluteWorkDir);
	goToTarget(workDir);

	try {
		execSync(command, { stdio: 'inherit' });
	} catch (error: unknown) {
		console.error('Build failed in:', absoluteWorkDir);
		console.error('Error message', error instanceof Error ? error.message : String(error));

		// For exec errors with stderr and stdout properties
		if (typeof error === 'object' && error !== null) {
			const execError = error as { stderr?: Buffer; stdout?: Buffer };
			if (execError.stderr) {
				console.error('Error output:', execError.stderr.toString());
			}
			if (execError.stdout) {
				console.error('Standard output:', execError.stdout.toString());
			}
		}
		throw error; // Ensure the test fails if the build fails
	}
};

describe('unit.appletGenerateCommand', async () => {
	describe('generate applets - bundlers', async () => {
		it('should generate TypeScript applet with webpack and git', async () => {
			const targetDir = 'tests/output/webpack';
			const command =
				baseCommand +
				`--bundler webpack --git yes --name webpack --packager npm --language typescript --target-dir ${getAbsolutePath(targetDir)}`;
			execSync(command, { stdio: 'inherit' });

			should(await fs.pathExists(targetDir)).be.true();
			should(await fs.pathExists(path.join(targetDir, 'webpack.config.js'))).be.true();
			should(await fs.pathExists(path.join(targetDir, '.gitignore'))).be.true();
			should(await fs.pathExists(path.join(targetDir, './node_modules'))).be.true();
		}).timeout(180000);

		it('should generate JavaScript applet with webpack', async () => {
			const targetDir = 'tests/output/webpack_js';
			const command =
				baseCommand +
				`--bundler webpack --git no --name webpack --packager npm --language javascript --target-dir ${getAbsolutePath(targetDir)}`;
			execSync(command, { stdio: 'inherit' });

			should(await fs.pathExists(targetDir)).be.true();
			should(await fs.pathExists(path.join(targetDir, 'webpack.config.js'))).be.true();
			should(await fs.pathExists(path.join(targetDir, './node_modules'))).be.true();
		}).timeout(180000);

		it('should generate JavaScript applet with rspack', async () => {
			const targetDir = 'tests/output/rspack_js';
			const command =
				baseCommand +
				`--bundler rspack --git no --name rspack --packager npm --language javascript --target-dir ${getAbsolutePath(targetDir)}`;
			execSync(command, { stdio: 'inherit' });

			should(await fs.pathExists(targetDir)).be.true();
			should(await fs.pathExists(path.join(targetDir, 'rspack.config.mjs'))).be.true();
			should(await fs.pathExists(path.join(targetDir, './node_modules'))).be.true();
		}).timeout(180000);
	});

	describe('build applets - bundlers', async () => {
		it('should build webpack applet', async () => {
			await buildApplet('tests/output/webpack', 'npm run build');
		}).timeout(180000);

		it('should build webpack_js applet', async () => {
			await buildApplet('tests/output/webpack_js', 'npm run build');
		}).timeout(180000);

		it('should build rspack_js applet', async () => {
			await buildApplet('tests/output/rspack_js', 'npm run build');
		}).timeout(180000);
	});

	describe('generate applets - packagers', async () => {
		it('should generate applet with yarn packager', async () => {
			process.chdir(path.join(rootPath));
			console.log('Current working directory:', process.cwd());
			const targetDir = 'tests/output/rspack_yarn';
			const command = [
				baseCommand,
				'--name rspack_yarn',
				'--bundler rspack',
				'--packager yarn',
				'--git no',
				'--language typescript',
				`--target-dir ${getAbsolutePath(targetDir)}`,
			].join(' ');
			execSync(command, { stdio: 'inherit' });

			should(await fs.pathExists(targetDir)).be.true();
			should(await fs.pathExists(path.join(targetDir, './node_modules'))).be.true();
		}).timeout(180000);

		it('should generate applet with pnpm packager', async () => {
			const targetDir = 'tests/output/rspack_pnpm';
			const command = [
				baseCommand,
				'--name rspack_pnpm',
				'--bundler rspack',
				'--packager pnpm',
				'--git no',
				'--language typescript',
				`--target-dir ${getAbsolutePath(targetDir)}`,
			].join(' ');
			execSync(command, { stdio: 'inherit' });

			should(await fs.pathExists(targetDir)).be.true();
			should(await fs.pathExists(path.join(targetDir, './node_modules'))).be.true();
		}).timeout(180000);

		it('should generate applet with bun packager', async () => {
			const targetDir = 'tests/output/rspack_bun';
			const command = [
				baseCommand,
				'--name rspack_bun',
				'--bundler rspack',
				'--packager bun',
				'--git no',
				'--language typescript',
				`--target-dir ${getAbsolutePath(targetDir)}`,
			].join(' ');
			execSync(command, { stdio: 'inherit' });

			should(await fs.pathExists(targetDir)).be.true();
			should(await fs.pathExists(path.join(targetDir, './node_modules'))).be.true();
		}).timeout(180000);

		it('should generate applet with npm packager and git init', async () => {
			const targetDir = 'tests/output/rspack_npm_git';
			const command = [
				baseCommand,
				'--name rspack_npm_git',
				'--bundler rspack',
				'--packager npm',
				'--git yes',
				'--language typescript',
				`--target-dir ${getAbsolutePath(targetDir)}`,
			].join(' ');
			execSync(command, { stdio: 'inherit' });

			should(await fs.pathExists(targetDir)).be.true();
			should(await fs.pathExists(path.join(targetDir, './node_modules'))).be.true();
		}).timeout(180000);
	});

	describe('build applets - packagers', async () => {
		it('should build rspack_yarn applet', async () => {
			await checkPackage('yarn');
			await buildApplet('tests/output/rspack_yarn', 'yarn run build');
		}).timeout(180000);

		it('should build rspack_pnpm applet', async () => {
			await checkPackage('pnpm');
			await buildApplet('tests/output/rspack_pnpm', 'pnpm run build');
		}).timeout(180000);

		it('should build rspack_bun applet', async () => {
			await checkPackage('bun');
			await buildApplet('tests/output/rspack_bun', 'bun run build');
		}).timeout(180000);

		it('should build rspack_npm_git applet', async () => {
			await buildApplet('tests/output/rspack_npm_git', 'npm run build');
		}).timeout(180000);
	});

	before(async function () {
		this.timeout(180000); // Timeout to prevent timeout errors

		// Clean up generated directories before each test
		fs.removeSync(outputDir); // Remove the directory if it exists
		fs.ensureDirSync(outputDir); // Ensure the directory is created
	});
});
