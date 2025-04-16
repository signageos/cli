import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs-extra';
import * as z from 'zod';
import prompts from 'prompts';
import chalk from 'chalk';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import { log } from '@signageos/sdk/dist/Console/log';
import { generateZip } from '../Lib/archive';
import { getFileMD5Checksum } from '../Lib/fileSystem';
import { ICustomScriptVersion } from '@signageos/sdk/dist/RestApi/CustomScript/Version/ICustomScriptVersion';
import { RUNTIME_DIRNAME } from '@signageos/sdk/dist/Development/runtimeFileSystem';

const CONFIG_FILE_NAME = '.sosconfig.json';
const CUSTOM_SCRIPTS_BUILDS_DIRNAME = 'custom_scripts_builds';

const PlatformSchema = z.strictObject({
	/** List of files/directories that are part of the custom script for a particular platform. */
	rootDir: z.string(),
	/** Main file of the particular platform script that will be executed. */
	mainFile: z.string(),
	/** What type of runtime is the script for the particular platform (i.e. node.js, bash,...). */
	runtime: z.string(),
});

export type PlatformConfig = z.infer<typeof PlatformSchema>;

const ConfigSchema = z.object({
	uid: z.string().optional(),
	name: z.string(),
	version: z.string(),
	description: z.string().optional(),
	dangerLevel: z.string(),
	/**
	 * Config of individual custom script implementations for each target platform.
	 *
	 * A Custom Script is only a virtual unit that consists of multiple platform-specific scripts.
	 * This record is a mapping of platform names to their respective platform-specific scripts.
	 */
	platforms: z.record(z.string(), PlatformSchema),
	configDefinition: z.array(z.object({}).passthrough()), // outsource validation to API because it's a bit complex
});

export type CustomScriptConfig = z.infer<typeof ConfigSchema>;

/**
 * Represents archive with Custom Script code for a particular platform
 */
export interface CodeArchive {
	filePath: string;
	md5Checksum: string;
	delete(): Promise<void>;
}

/**
 * Load and validate the config file .sosconfig.json
 */
export async function getConfig(workDir: string) {
	const config = await loadConfigFromFile(workDir);
	return ConfigSchema.parse(config);
}

/**
 * Add data to the config file .sosconfig.json
 */
export async function addToConfigFile(workDir: string, data: Partial<CustomScriptConfig>) {
	const previousContent = await loadConfigFromFile(workDir);
	const filePath = getConfigFilePath(workDir);
	const newContent = Object.assign({}, previousContent, data);
	await fs.writeFile(filePath, JSON.stringify(newContent, undefined, '\t') + '\n');
}

async function loadConfigFromFile(workDir: string) {
	const filePath = getConfigFilePath(workDir);

	if (!(await fs.pathExists(filePath))) {
		throw new Error(`Config file ${CONFIG_FILE_NAME} not found`);
	}

	const fileContent = fs.readFileSync(filePath, 'utf-8');
	return JSON.parse(fileContent);
}

function getConfigFilePath(workDir: string) {
	return path.join(workDir, CONFIG_FILE_NAME);
}

export async function ensureCustomScriptVersion(restApi: RestApi, config: CustomScriptConfig) {
	const customScript = await ensureCustomScript(restApi, config);

	const customScriptVersion = await restApi.customScript.version.get({
		customScriptUid: customScript.uid,
		version: config.version,
	});

	if (customScriptVersion) {
		return customScriptVersion;
	}

	const response: prompts.Answers<'newVersion'> = await prompts({
		type: 'confirm',
		name: 'newVersion',
		message: `Do you want to create new custom script version ${config.version}?`,
	});

	if (!response.newVersion) {
		throw new Error('Custom Script version creation was canceled.');
	}

	log('info', chalk.yellow(`Creating Custom Script version ${config.version}`));

	return await restApi.customScript.version.create({
		customScriptUid: customScript.uid,
		version: config.version,
		configDefinition: config.configDefinition,
	});
}

async function ensureCustomScript(restApi: RestApi, config: CustomScriptConfig) {
	if (config.uid) {
		const customScript = await restApi.customScript.get(config.uid);
		if (customScript) {
			await restApi.customScript.update(customScript.uid, {
				name: config.name,
				title: config.name, // TODO change
				description: config.description,
				dangerLevel: config.dangerLevel,
			});

			return customScript;
		}

		throw new Error(`Custom Script with uid "${config.uid}" not found`);
	}

	const response = await prompts({
		type: 'confirm',
		name: 'create',
		message: `Custom Script "${config.name}" does not exist. Do you want to create it?`,
	});

	if (!response.create) {
		throw new Error('Custom Script upload was canceled.');
	}

	log('info', chalk.yellow(`Creating Custom Script "${config.name}"`));

	const createdCustomScript = await restApi.customScript.create({
		name: config.name,
		title: config.name, // TODO change
		description: config.description,
		dangerLevel: config.dangerLevel,
	});

	// TODO ask for permission or read from CLI arg
	log('info', chalk.yellow('Adding Custom Script uid to the config file'));
	await addToConfigFile(process.cwd(), { uid: createdCustomScript.uid });

	return createdCustomScript;
}

export async function uploadCode({
	restApi,
	workDir,
	platform,
	config,
	customScriptVersion,
}: {
	restApi: RestApi;
	workDir: string;
	platform: string;
	config: PlatformConfig;
	customScriptVersion: ICustomScriptVersion;
}) {
	const { mainFile, runtime } = config;

	const codeArchive = await generateCustomScriptPlatformCodeArchive(workDir, config, customScriptVersion, platform);

	const customScriptVersionPlatform = await restApi.customScript.version.platform.get({
		customScriptUid: customScriptVersion.customScriptUid,
		version: customScriptVersion.version,
		platform,
	});

	if (customScriptVersionPlatform?.md5Checksum === codeArchive.md5Checksum) {
		log('info', chalk.yellow(`Skipping upload for ${platform} - no changes detected`));
		return;
	}

	try {
		log('info', chalk.yellow(`Uploading files for ${platform}`));

		await uploadCodeArchive({
			restApi,
			customScriptVersion,
			platform,
			codeArchive,
		});

		await restApi.customScript.version.platform.update({
			customScriptUid: customScriptVersion.customScriptUid,
			version: customScriptVersion.version,
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
	customScriptVersion,
	platform,
	codeArchive,
}: {
	restApi: RestApi;
	customScriptVersion: ICustomScriptVersion;
	platform: string;
	codeArchive: CodeArchive;
}) {
	const filePath = codeArchive.filePath;
	const fileSize = (await fs.stat(filePath)).size;
	const fileStream = fs.createReadStream(filePath);

	await restApi.customScript.version.platform.archive.upload({
		customScriptUid: customScriptVersion.customScriptUid,
		version: customScriptVersion.version,
		platform,
		md5Checksum: codeArchive.md5Checksum,
		size: fileSize,
		stream: fileStream,
	});
}

/**
 * Generates an archive with the code for a particular platform, defined by the provided configuration.
 *
 * Archive is generated and stored in the runtime /tmp/signageos/custom_scripts_builds/:uid/:version/ directory.
 * After archive isn't needed anymore, it should be deleted using the delete method.
 */
async function generateCustomScriptPlatformCodeArchive(
	workDir: string,
	config: PlatformConfig,
	customScriptVersion: ICustomScriptVersion,
	platform: string,
): Promise<CodeArchive> {
	const buildsDir = await ensureBuildsDirectory(customScriptVersion);
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
 * Ensure that the runtime directory for custom script version exists in the current working directory.
 *
 * This directory is used to store temporary files generated by the CLI.
 */
async function ensureBuildsDirectory(customScriptVersion: ICustomScriptVersion) {
	const runtimeDir = await ensureRuntimeDir();
	const buildsDir = path.join(runtimeDir, customScriptVersion.customScriptUid, customScriptVersion.version);
	await fs.ensureDir(buildsDir);
	return buildsDir;
}

/**
 * Ensure that the runtime directory exists in the current working directory.
 *
 * This directory is used to store temporary files generated by the CLI.
 */
async function ensureRuntimeDir() {
	const runtimeDir = path.join(os.tmpdir(), RUNTIME_DIRNAME, CUSTOM_SCRIPTS_BUILDS_DIRNAME);
	await fs.ensureDir(runtimeDir);

	return runtimeDir;
}
