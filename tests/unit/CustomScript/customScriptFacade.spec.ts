import * as path from 'path';
import * as fs from 'fs-extra';
import should from 'should';
import * as sinon from 'sinon';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import RequestError from '@signageos/sdk/dist/RestApi/Error/RequestError';
import prompts from 'prompts';
import { useTmpFiles } from '../../lib/tmpFiles';
import {
	getConfig,
	addToConfigFile,
	ensureCustomScriptVersion,
	resolveManaged,
	CustomScriptConfig,
} from '../../../src/CustomScript/customScriptFacade';
import { SOS_CONFIG_FILE_NAME } from '../../../src/Lib/fileSystem';

describe('CustomScript.customScriptFacade', function () {
	const tmpDir = useTmpFiles();

	const validConfig: CustomScriptConfig = {
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

	describe('resolveManaged', function () {
		const newScriptConfig: CustomScriptConfig = { ...validConfig };

		it('should use the flag when the config points at no existing script', function () {
			should(resolveManaged(newScriptConfig, true)).be.true();
			should(resolveManaged(newScriptConfig, undefined)).be.false();
		});

		it('should honour the persisted managed value over the flag for an existing script', function () {
			should(resolveManaged({ ...validConfig, uid: 'cs-1', managed: true }, undefined)).be.true();
			should(resolveManaged({ ...validConfig, uid: 'cs-1', managed: false }, undefined)).be.false();
		});

		it('should not throw when the flag matches the persisted managed value', function () {
			should(resolveManaged({ ...validConfig, uid: 'cs-1', managed: true }, true)).be.true();
		});

		it('should throw when --managed is used on an organization-owned script', function () {
			should(() => resolveManaged({ ...validConfig, uid: 'cs-1', managed: false }, true)).throw(/organization-owned/);
		});

		// Organization-owned is the implicit default, so an existing script simply has no `managed` key at all.
		it('should treat an existing script without the managed key as organization-owned', function () {
			should(resolveManaged({ ...validConfig, uid: 'cs-1' }, undefined)).be.false();
			should(resolveManaged({ ...validConfig, uid: 'cs-1' }, false)).be.false();
			should(() => resolveManaged({ ...validConfig, uid: 'cs-1' }, true)).throw(/organization-owned/);
		});

		it('should throw when a managed script is uploaded without --managed being consistent', function () {
			should(() => resolveManaged({ ...validConfig, uid: 'cs-1', managed: true }, false)).throw(/is managed/);
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

		describe('name already taken', function () {
			const nameConflictError = new RequestError(409, {
				errorName: 'CUSTOM_SCRIPT_NAME_ALREADY_EXISTS',
				message: 'Conflict - Custom script with name test-script already exists in this organization: cs-uid-1',
			});

			function createMockRestApi(createError: Error, listed: { uid: string; name: string }[]) {
				return {
					customScript: {
						list: sinon.fake.resolves(listed),
						create: sinon.fake.rejects(createError),
						version: {
							get: sinon.fake.resolves(existingVersion),
						},
					},
				};
			}

			it('should point at the existing script instead of failing with the raw API error when confirmations are skipped', async function () {
				const mockRestApi = createMockRestApi(nameConflictError, [existingCustomScript]);

				await should(ensureCustomScriptVersion(mockRestApi as unknown as RestApi, { ...validConfig }, true, 'org-1')).be.rejectedWith(
					/Custom Script "test-script" already exists \(uid "cs-uid-1"\)\..*\.sosconfig\.json/,
				);
			});

			it('should upload into the existing script and record its uid once confirmed', async function () {
				const mockRestApi = createMockRestApi(nameConflictError, [existingCustomScript]);
				await fs.writeFile(path.join(tmpDir, SOS_CONFIG_FILE_NAME), JSON.stringify(validConfig, undefined, '\t'));
				const cwdStub = sinon.stub(process, 'cwd').returns(tmpDir);
				// Two confirmations: the create prompt, then the prompt offering the script that already holds the name.
				prompts.inject([true, true]);

				try {
					const result = await ensureCustomScriptVersion(mockRestApi as unknown as RestApi, { ...validConfig }, false, 'org-1');

					should(result).be.eql(existingVersion);
				} finally {
					cwdStub.restore();
				}

				const writtenConfig = JSON.parse(await fs.readFile(path.join(tmpDir, SOS_CONFIG_FILE_NAME), 'utf-8'));
				should(writtenConfig.uid).be.equal('cs-uid-1');
			});

			it('should rethrow errors that are not a name conflict', async function () {
				const mockRestApi = createMockRestApi(new Error('Something else broke'), [existingCustomScript]);

				await should(ensureCustomScriptVersion(mockRestApi as unknown as RestApi, { ...validConfig }, true, 'org-1')).be.rejectedWith(
					'Something else broke',
				);
			});
		});

		describe('config file written on creation', function () {
			// ensureCustomScript writes the created uid back into the config file in the current directory.
			async function createScriptInTmpDir(managed: boolean) {
				const mockRestApi = {
					customScript: {
						create: sinon.fake.resolves(existingCustomScript),
						managed: {
							create: sinon.fake.resolves(existingCustomScript),
						},
						version: {
							get: sinon.fake.resolves(existingVersion),
						},
					},
				};
				await fs.writeFile(path.join(tmpDir, SOS_CONFIG_FILE_NAME), JSON.stringify(validConfig, undefined, '\t'));
				const cwdStub = sinon.stub(process, 'cwd').returns(tmpDir);

				try {
					await ensureCustomScriptVersion(mockRestApi as unknown as RestApi, { ...validConfig }, true, 'org-1', managed);
				} finally {
					cwdStub.restore();
				}

				return JSON.parse(await fs.readFile(path.join(tmpDir, SOS_CONFIG_FILE_NAME), 'utf-8'));
			}

			it('should not write managed for an organization-owned script', async function () {
				const writtenConfig = await createScriptInTmpDir(false);

				should(writtenConfig.uid).be.equal('cs-uid-1');
				should(writtenConfig).not.have.property('managed');
			});

			it('should write managed true for a managed script', async function () {
				const writtenConfig = await createScriptInTmpDir(true);

				should(writtenConfig.uid).be.equal('cs-uid-1');
				should(writtenConfig.managed).be.true();
			});
		});
	});
});
