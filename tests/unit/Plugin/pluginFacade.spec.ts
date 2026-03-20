import * as path from 'path';
import * as fs from 'fs-extra';
import should from 'should';
import * as sinon from 'sinon';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import { useTmpFiles } from '../../lib/tmpFiles';
import { getSosConfig, loadSchemas, ensurePluginVersion, PluginConfig } from '../../../src/Plugin/pluginFacade';
import { SOS_CONFIG_FILE_NAME } from '../../../src/Lib/fileSystem';

describe('Plugin.pluginFacade', function () {
	const tmpDir = useTmpFiles();

	const validConfig = {
		name: 'test-plugin',
		version: '1.0.0',
		platforms: {
			tizen: { rootDir: 'dist/tizen', mainFile: 'index.js', runtime: 'webos' },
		},
		configDefinition: [],
	};

	describe('getSosConfig', function () {
		it('should load and parse a valid config file', async function () {
			await fs.writeFile(path.join(tmpDir, SOS_CONFIG_FILE_NAME), JSON.stringify(validConfig, undefined, '\t'));

			const result = await getSosConfig(tmpDir);

			should(result.name).be.equal('test-plugin');
			should(result.version).be.equal('1.0.0');
		});

		it('should parse config with sos front-applet version', async function () {
			const config = { ...validConfig, sos: { '@signageos/front-applet': '5.0.0' } };
			await fs.writeFile(path.join(tmpDir, SOS_CONFIG_FILE_NAME), JSON.stringify(config, undefined, '\t'));

			const result = await getSosConfig(tmpDir);

			should(result.sos?.['@signageos/front-applet']).be.equal('5.0.0');
		});

		it('should throw if config file does not exist', async function () {
			const nonExistentDir = path.join(tmpDir, 'nonexistent');
			await fs.ensureDir(nonExistentDir);

			await should(getSosConfig(nonExistentDir)).be.rejectedWith(/Config file .sosconfig.json not found/);
		});

		it('should throw descriptive error for invalid JSON', async function () {
			await fs.writeFile(path.join(tmpDir, SOS_CONFIG_FILE_NAME), '{ invalid json }');

			await should(getSosConfig(tmpDir)).be.rejectedWith(/Invalid JSON in \.sosconfig\.json/);
		});
	});

	describe('loadSchemas', function () {
		it('should load and parse a valid schema file', async function () {
			const schema = { schema: { type: 'object' }, input: {}, output: {} };
			await fs.writeFile(path.join(tmpDir, 'schema.json'), JSON.stringify(schema, undefined, '\t'));

			const result = await loadSchemas(tmpDir);

			should(result.schema).be.eql({ type: 'object' });
		});

		it('should throw if schema file does not exist', async function () {
			const nonExistentDir = path.join(tmpDir, 'nonexistent-schema');
			await fs.ensureDir(nonExistentDir);

			await should(loadSchemas(nonExistentDir)).be.rejectedWith(/Config file schema.json not found/);
		});
	});

	describe('ensurePluginVersion', function () {
		const existingPlugin = { uid: 'plugin-uid-1', name: 'test-plugin' };
		const existingVersion = { pluginUid: 'plugin-uid-1', version: '1.0.0' };

		const configWithUid: PluginConfig = {
			...validConfig,
			uid: 'plugin-uid-1',
			sos: { '@signageos/front-applet': '5.0.0' },
		};

		it('should return existing version when it already exists', async function () {
			const mockRestApi = {
				plugin: {
					get: sinon.fake.resolves(existingPlugin),
					update: sinon.fake.resolves(undefined),
					version: {
						get: sinon.fake.resolves(existingVersion),
					},
				},
			};

			const schema = { schema: { type: 'object' } };
			const result = await ensurePluginVersion(mockRestApi as unknown as RestApi, configWithUid, schema, true);

			should(result).be.eql(existingVersion);
		});

		it('should create new version with jsApiVersion when version does not exist', async function () {
			const createdVersion = { pluginUid: 'plugin-uid-1', version: '1.0.0' };
			const mockRestApi = {
				plugin: {
					get: sinon.fake.resolves(existingPlugin),
					update: sinon.fake.resolves(undefined),
					version: {
						get: sinon.fake.resolves(null),
						create: sinon.fake.resolves(createdVersion),
					},
				},
			};

			const schema = { schema: { type: 'object' } };
			const result = await ensurePluginVersion(mockRestApi as unknown as RestApi, configWithUid, schema, true);

			should(result).be.eql(createdVersion);
			const createArgs = mockRestApi.plugin.version.create.firstCall.args[0];
			should(createArgs.jsApiVersion).be.equal('5.0.0');
			should(createArgs.pluginUid).be.equal('plugin-uid-1');
		});

		it('should throw when plugin uid is not found', async function () {
			const mockRestApi = {
				plugin: {
					get: sinon.fake.resolves(null),
				},
			};

			const schema = { schema: {} };
			await should(ensurePluginVersion(mockRestApi as unknown as RestApi, configWithUid, schema, true)).be.rejectedWith(
				/Plugin with uid "plugin-uid-1" not found/,
			);
		});
	});
});
