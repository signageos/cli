import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs-extra';
import z from 'zod';
import prompts from 'prompts';
import chalk from 'chalk';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import { log } from '@signageos/sdk/dist/Console/log';
import { generateZip } from '../Lib/archive';
import { getFileMD5Checksum } from '../Lib/fileSystem';
import { RUNTIME_DIRNAME } from '@signageos/sdk/dist/Development/runtimeFileSystem';
import { IPluginVersion } from '@signageos/sdk/dist/RestApi/Plugin/Version/IPluginVersion';
import { addToConfigFile, PlatformConfig, CodeArchive, PlatformSchema } from '../CustomScript/customScriptFacade';

const PLUGIN_BUILDS_DIRNAME = 'plugin_builds';

export async function ensurePluginVersion(restApi: RestApi, config: PluginConfig, schema: any, skipConfirmation?: boolean) {
	const plugin = await ensurePlugin(restApi, config, skipConfirmation);

	const pluginVersion = await restApi.plugin.version.get({
		pluginUid: plugin.uid,
		version: config.version,
	});

	if (pluginVersion) {
		return pluginVersion;
	}

	if (skipConfirmation) {
		log('info', chalk.yellow(`Creating Plugin version ${config.version}`));
	} else {
		const response: prompts.Answers<'newVersion'> = await prompts({
			type: 'confirm',
			name: 'newVersion',
			message: `Do you want to create new plugin version ${config.version}?`,
		});

		if (!response.newVersion) {
			throw new Error('Plugin version creation was canceled.');
		}

		log('info', chalk.yellow(`Creating Plugin version ${config.version}`));
	}

	return await restApi.plugin.version.create({
		pluginUid: plugin.uid,
		version: config.version,
		description: config.description,
		schema: schema.schema,
		configDefinition: config.configDefinition,
	});
}

async function ensurePlugin(restApi: RestApi, config: PluginConfig, skipConfirmation?: boolean) {
	if (config.uid) {
		const plugin = await restApi.plugin.get(config.uid);
		if (plugin) {
			await restApi.plugin.update(plugin.uid, {
				name: config.name,
				title: config.name,
				description: config.description,
			});
			return plugin;
		}

		throw new Error(`Plugin with uid "${config.uid}" not found`);
	}

	if (skipConfirmation) {
		log('info', chalk.yellow(`Creating Plugin "${config.name}"`));
	} else {
		const response = await prompts({
			type: 'confirm',
			name: 'create',
			message: `Plugin "${config.name}" does not exist. Do you want to create it?`,
		});

		if (!response.create) {
			throw new Error('Plugin upload was canceled.');
		}

		log('info', chalk.yellow(`Creating Plugin "${config.name}"`));
	}

	const createdPlugin = await restApi.plugin.create({
		name: config.name,
		title: config.name,
		description: config.description,
	});

	// TODO ask for permission or read from CLI arg
	log('info', chalk.yellow('Adding Plugin uid to the config file'));
	await addToConfigFile(process.cwd(), { uid: createdPlugin.uid });

	return createdPlugin;
}

export async function uploadCode({
	restApi,
	workDir,
	platform,
	config,
	pluginVersion,
}: {
	restApi: RestApi;
	workDir: string;
	platform: string;
	config: PlatformConfig;
	pluginVersion: IPluginVersion;
}) {
	const { mainFile, runtime } = config;

	const codeArchive = await generatePluginPlatformCodeArchive(workDir, config, pluginVersion, platform);

	const pluginVersionPlatform = await restApi.plugin.version.platform.get({
		pluginUid: pluginVersion.pluginUid,
		version: pluginVersion.version,
		platform,
	});

	if (pluginVersionPlatform?.md5Checksum === codeArchive.md5Checksum) {
		log('info', chalk.yellow(`Skipping upload for ${platform} - no changes detected`));
		return;
	}

	try {
		log('info', chalk.yellow(`Uploading files for ${platform}`));

		await uploadCodeArchive({
			restApi,
			pluginVersion,
			platform,
			codeArchive,
		});

		await restApi.plugin.version.platform.update({
			pluginUid: pluginVersion.pluginUid,
			version: pluginVersion.version,
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
	pluginVersion,
	platform,
	codeArchive,
}: {
	restApi: RestApi;
	pluginVersion: IPluginVersion;
	platform: string;
	codeArchive: CodeArchive;
}) {
	const filePath = codeArchive.filePath;
	const fileSize = (await fs.stat(filePath)).size;
	const fileStream = fs.createReadStream(filePath);

	await restApi.plugin.version.platform.archive.upload({
		pluginUid: pluginVersion.pluginUid,
		version: pluginVersion.version,
		platform,
		md5Checksum: codeArchive.md5Checksum,
		size: fileSize,
		stream: fileStream,
	});
}

/**
 * Generates an archive with the code for a particular platform, defined by the provided configuration.
 *
 * Archive is generated and stored in the runtime /tmp/signageos/plugin_scripts_builds/:uid/:version/ directory.
 * After archive isn't needed anymore, it should be deleted using the delete method.
 */
async function generatePluginPlatformCodeArchive(
	workDir: string,
	config: PlatformConfig,
	pluginVersion: IPluginVersion,
	platform: string,
): Promise<CodeArchive> {
	const buildsDir = await ensureBuildsDirectory(pluginVersion);
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
 * Ensure that the runtime directory for plugin script version exists in the current working directory.
 *
 * This directory is used to store temporary files generated by the CLI.
 */
async function ensureBuildsDirectory(pluginVersion: IPluginVersion) {
	const runtimeDir = await ensureRuntimeDir();
	const buildsDir = path.join(runtimeDir, pluginVersion.pluginUid, pluginVersion.version);
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

export const ConfigSchema = z.object({
	uid: z.string().optional(),
	name: z.string(),
	version: z.string(),
	description: z.string().optional(),
	/**
	 * Config of individual plugin script implementations for each target platform.
	 *
	 * A plugin Script is only a virtual unit that consists of multiple platform-specific scripts.
	 * This record is a mapping of platform names to their respective platform-specific scripts.
	 */
	platforms: z.record(z.string(), PlatformSchema),
	configDefinition: z.array(z.object({}).passthrough()), // outsource validation to API because it's a bit complex
});

export type PluginConfig = z.infer<typeof ConfigSchema>;
