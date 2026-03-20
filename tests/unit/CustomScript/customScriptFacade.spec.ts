import * as path from 'path';
import * as fs from 'fs-extra';
import should from 'should';
import * as sinon from 'sinon';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import { useTmpFiles } from '../../lib/tmpFiles';
import { getConfig, addToConfigFile, ensureCustomScriptVersion, CustomScriptConfig } from '../../../src/CustomScript/customScriptFacade';
import { SOS_CONFIG_FILE_NAME } from '../../../src/Lib/fileSystem';

describe('CustomScript.customScriptFacade', function () {
	const tmpDir = useTmpFiles();

	const validConfig = {
		name: 'test-script',
		version: '1.0.0',
		description: 'Test custom script',
		dangerLevel: 'low',
		platforms: {
			tizen: { rootDir: 'dist/tizen', mainFile: 'index.js', runtime: 'webos' },
		},
		configDefinition: [],
	};

	describe('getConfig', function () {
		it('should load and validate a valid config file', async function () {
			await fs.writeFile(path.join(tmpDir, SOS_CONFIG_FILE_NAME), JSON.stringify(validConfig, undefined, '\t'));

			const result = await getConfig(tmpDir);

			should(result.name).be.equal('test-script');
			should(result.version).be.equal('1.0.0');
			should(result.dangerLevel).be.equal('low');
		});

		it('should parse config with sos front-applet version', async function () {
			const config = { ...validConfig, sos: { '@signageos/front-applet': '5.0.0' } };
			await fs.writeFile(path.join(tmpDir, SOS_CONFIG_FILE_NAME), JSON.stringify(config, undefined, '\t'));

			const result = await getConfig(tmpDir);

			should(result.sos?.['@signageos/front-applet']).be.equal('5.0.0');
		});

		it('should throw if config file does not exist', async function () {
			const nonExistentDir = path.join(tmpDir, 'nonexistent-cs');
			await fs.ensureDir(nonExistentDir);

			await should(getConfig(nonExistentDir)).be.rejectedWith(/Config file .sosconfig.json not found/);
		});

		it('should throw descriptive error for invalid JSON', async function () {
			await fs.writeFile(path.join(tmpDir, SOS_CONFIG_FILE_NAME), '{ broken }');

			await should(getConfig(tmpDir)).be.rejectedWith(/Invalid JSON in \.sosconfig\.json/);
		});
	});

	describe('addToConfigFile', function () {
		it('should add data to existing config file', async function () {
			await fs.writeFile(path.join(tmpDir, SOS_CONFIG_FILE_NAME), JSON.stringify(validConfig, undefined, '\t'));

			await addToConfigFile(tmpDir, { description: 'Updated description' });

			const result = JSON.parse(await fs.readFile(path.join(tmpDir, SOS_CONFIG_FILE_NAME), 'utf-8'));
			should(result.description).be.equal('Updated description');
			should(result.name).be.equal('test-script');
		});

		it('should merge new data with existing data', async function () {
			await fs.writeFile(path.join(tmpDir, SOS_CONFIG_FILE_NAME), JSON.stringify(validConfig, undefined, '\t'));

			await addToConfigFile(tmpDir, { uid: 'abc-123' });

			const result = JSON.parse(await fs.readFile(path.join(tmpDir, SOS_CONFIG_FILE_NAME), 'utf-8'));
			should(result.uid).be.equal('abc-123');
			should(result.name).be.equal('test-script');
		});
	});

	describe('ensureCustomScriptVersion', function () {
		const existingVersion = { customScriptUid: 'cs-uid-1', version: '1.0.0' };
		const existingCustomScript = { uid: 'cs-uid-1', name: 'test-script' };

		const configWithUid: CustomScriptConfig = {
			...validConfig,
			uid: 'cs-uid-1',
			sos: { '@signageos/front-applet': '5.0.0' },
		};

		it('should return existing version when it already exists', async function () {
			const mockRestApi = {
				customScript: {
					get: sinon.fake.resolves(existingCustomScript),
					update: sinon.fake.resolves(undefined),
					version: {
						get: sinon.fake.resolves(existingVersion),
					},
				},
			};

			const result = await ensureCustomScriptVersion(mockRestApi as unknown as RestApi, configWithUid, true);

			should(result).be.eql(existingVersion);
			should(mockRestApi.customScript.version.get.calledOnce).be.true();
		});

		it('should create new version with jsApiVersion when version does not exist', async function () {
			const createdVersion = { customScriptUid: 'cs-uid-1', version: '1.0.0' };
			const mockRestApi = {
				customScript: {
					get: sinon.fake.resolves(existingCustomScript),
					update: sinon.fake.resolves(undefined),
					version: {
						get: sinon.fake.resolves(null),
						create: sinon.fake.resolves(createdVersion),
					},
				},
			};

			const result = await ensureCustomScriptVersion(mockRestApi as unknown as RestApi, configWithUid, true);

			should(result).be.eql(createdVersion);
			const createArgs = mockRestApi.customScript.version.create.firstCall.args[0];
			should(createArgs.jsApiVersion).be.equal('5.0.0');
			should(createArgs.customScriptUid).be.equal('cs-uid-1');
		});

		it('should throw when custom script uid is not found', async function () {
			const mockRestApi = {
				customScript: {
					get: sinon.fake.resolves(null),
				},
			};

			await should(ensureCustomScriptVersion(mockRestApi as unknown as RestApi, configWithUid, true)).be.rejectedWith(
				/Custom Script with uid "cs-uid-1" not found/,
			);
		});
	});
});
