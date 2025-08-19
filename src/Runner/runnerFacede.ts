import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs-extra';
import prompts from 'prompts';
import chalk from 'chalk';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import { log } from '@signageos/sdk/dist/Console/log';
import { generateZip } from '../Lib/archive';
import { getFileMD5Checksum } from '../Lib/fileSystem';
import { RUNTIME_DIRNAME } from '@signageos/sdk/dist/Development/runtimeFileSystem';
import { addToConfigFile, CodeArchive, PlatformConfig } from '../CustomScript/customScriptFacade';
import { IRunnerVersion } from '@signageos/sdk/dist/RestApi/Runner/Version/IRunnerVersion';
import z from 'zod';
import { ConfigSchema } from '../Plugin/pluginFacade';

const PLUGIN_BUILDS_DIRNAME = 'plugin_builds';

export async function ensureRunnerVersion(restApi: RestApi, config: RunnerConfig, schema: any) {
	const runner = await ensureRunner(restApi, config);

	const runnerVersion = await restApi.runner.version.get({ runnerUid: runner.uid, version: config.version });

	if (runnerVersion) {
		return runnerVersion;
	}

	const response: prompts.Answers<'newVersion'> = await prompts({
		type: 'confirm',
		name: 'newVersion',
		message: `Do you want to create new runner version ${config.version}?`,
	});

	if (!response.newVersion) {
		throw new Error('Runner version creation was canceled.');
	}

	log('info', chalk.yellow(`Creating Runner version ${config.version}`));

	return await restApi.runner.version.create({
		runnerUid: runner.uid,
		version: config.version,
		description: config.description!,
		input: schema.input,
		output: schema.output,
		telemetry: schema.telemetry,
		configDefinition: config.configDefinition,
	});
}

async function ensureRunner(restApi: RestApi, config: RunnerConfig) {
	if (config.uid) {
		const runner = await restApi.runner.get(config.uid);
		if (runner) {
			await restApi.runner.update(runner.uid, {
				name: config.name,
				title: config.name,
				description: config.description,
			});
			return runner;
		}

		throw new Error(`Runner with uid "${config.uid}" not found`);
	}

	const response = await prompts({
		type: 'confirm',
		name: 'create',
		message: `Runner "${config.name}" does not exist. Do you want to create it?`,
	});

	if (!response.create) {
		throw new Error('Runner upload was canceled.');
	}

	log('info', chalk.yellow(`Creating Runner "${config.name}"`));

	const createdRunner = await restApi.runner.create({
		name: config.name,
		title: config.name,
		description: config.description,
	});

	// TODO ask for permission or read from CLI arg
	log('info', chalk.yellow('Adding Runner uid to the config file'));
	await addToConfigFile(process.cwd(), { uid: createdRunner.uid });

	return createdRunner;
}

export async function uploadCode({
	restApi,
	workDir,
	platform,
	config,
	runnerVersion,
}: {
	restApi: RestApi;
	workDir: string;
	platform: string;
	config: PlatformConfig;
	runnerVersion: IRunnerVersion;
}) {
	const { mainFile, runtime } = config;

	const codeArchive = await generateRunnerPlatformCodeArchive(workDir, config, runnerVersion, platform);

	const runnerVersionPlatform = await restApi.runner.version.platform.get({
		runnerUid: runnerVersion.runnerUid,
		version: runnerVersion.version,
		platform,
	});

	if (runnerVersionPlatform?.md5Checksum === codeArchive.md5Checksum) {
		log('info', chalk.yellow(`Skipping upload for ${platform} - no changes detected`));
		return;
	}

	try {
		log('info', chalk.yellow(`Uploading files for ${platform}`));

		await uploadCodeArchive({
			restApi,
			runnerVersion,
			platform,
			codeArchive,
		});

		await restApi.runner.version.platform.update({
			runnerUid: runnerVersion.runnerUid,
			version: runnerVersion.version,
			platform,
			mainFile,
			runtime,
			md5Checksum: codeArchive.md5Checksum,
		});
	} finally {
		await codeArchive.delete();
	}
}

async function uploadCodeArchive({
	restApi,
	runnerVersion,
	platform,
	codeArchive,
}: {
	restApi: RestApi;
	runnerVersion: IRunnerVersion;
	platform: string;
	codeArchive: CodeArchive;
}) {
	const filePath = codeArchive.filePath;
	const fileSize = (await fs.stat(filePath)).size;
	const fileStream = fs.createReadStream(filePath);

	await restApi.runner.version.platform.archive.upload({
		runnerUid: runnerVersion.runnerUid,
		version: runnerVersion.version,
		platform,
		md5Checksum: codeArchive.md5Checksum,
		size: fileSize,
		stream: fileStream,
	});
}

/**
 * Generates an archive with the code for a particular platform, defined by the provided configuration.
 *
 * Archive is generated and stored in the runtime /tmp/signageos/runner_scripts_builds/:uid/:version/ directory.
 * After archive isn't needed anymore, it should be deleted using the delete method.
 */
async function generateRunnerPlatformCodeArchive(
	workDir: string,
	config: PlatformConfig,
	runnerVersion: IRunnerVersion,
	platform: string,
): Promise<CodeArchive> {
	const buildsDir = await ensureBuildsDirectory(runnerVersion);
	const archiveFileName = `${platform}.zip`;
	const archiveFilePath = path.join(buildsDir, archiveFileName);

	await generateZip(workDir, config.rootDir, archiveFilePath);

	const md5Checksum = await getFileMD5Checksum(archiveFilePath);

	return {
		filePath: archiveFilePath,
		md5Checksum,
		async delete() {
			await fs.unlink(archiveFilePath);
		},
	};
}

/**
 * Ensure that the runtime directory for runner script version exists in the current working directory.
 *
 * This directory is used to store temporary files generated by the CLI.
 */
async function ensureBuildsDirectory(runnerVersion: IRunnerVersion) {
	const runtimeDir = await ensureRuntimeDir();
	const buildsDir = path.join(runtimeDir, runnerVersion.runnerUid, runnerVersion.version);
	await fs.ensureDir(buildsDir);
	return buildsDir;
}

/**
 * Ensure that the runtime directory exists in the current working directory.
 *
 * This directory is used to store temporary files generated by the CLI.
 */
async function ensureRuntimeDir() {
	const runtimeDir = path.join(os.tmpdir(), RUNTIME_DIRNAME, PLUGIN_BUILDS_DIRNAME);
	await fs.ensureDir(runtimeDir);

	return runtimeDir;
}

export async function loadSchemas(workDir: string) {
	const filePath = getConfigFilePath(workDir);

	if (!(await fs.pathExists(filePath))) {
		throw new Error(`Config file schema.json not found`);
	}

	const fileContent = fs.readFileSync(filePath, 'utf-8');
	return JSON.parse(fileContent);
}

function getConfigFilePath(workDir: string) {
	return path.join(workDir, 'schema.json');
}

export type RunnerConfig = z.infer<typeof ConfigSchema>;
