import * as path from 'path';
import * as fs from 'fs-extra';
import should from 'should';
import * as sinon from 'sinon';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import { useTmpFiles } from '../../lib/tmpFiles';
import { loadSchemas, ensureRunnerVersion, RunnerConfig } from '../../../src/Runner/runnerFacade';

describe('Runner.runnerFacade', function () {
	const tmpDir = useTmpFiles();

	describe('loadSchemas', function () {
		it('should load and parse a valid schema file', async function () {
			const schema = { input: { type: 'string' }, output: { type: 'number' }, telemetry: {} };
			await fs.writeFile(path.join(tmpDir, 'schema.json'), JSON.stringify(schema, undefined, '\t'));

			const result = await loadSchemas(tmpDir);

			should(result.input).be.eql({ type: 'string' });
			should(result.output).be.eql({ type: 'number' });
		});

		it('should throw if schema file does not exist', async function () {
			const nonExistentDir = path.join(tmpDir, 'nonexistent-runner');
			await fs.ensureDir(nonExistentDir);

			await should(loadSchemas(nonExistentDir)).be.rejectedWith(/Config file schema.json not found/);
		});
	});

	describe('ensureRunnerVersion', function () {
		const existingRunner = { uid: 'runner-uid-1', name: 'test-runner' };
		const existingVersion = { runnerUid: 'runner-uid-1', version: '1.0.0' };

		const configWithUid: RunnerConfig = {
			uid: 'runner-uid-1',
			name: 'test-runner',
			version: '1.0.0',
			description: 'Test runner',
			sos: { '@signageos/front-applet': '5.0.0' },
			platforms: {
				tizen: { rootDir: 'dist/tizen', mainFile: 'index.js', runtime: 'webos' },
			},
			configDefinition: [],
		};

		it('should return existing version when it already exists', async function () {
			const mockRestApi = {
				runner: {
					get: sinon.fake.resolves(existingRunner),
					update: sinon.fake.resolves(undefined),
					version: {
						get: sinon.fake.resolves(existingVersion),
					},
				},
			};

			const schema = { input: {}, output: {}, telemetry: {} };
			const result = await ensureRunnerVersion(mockRestApi as unknown as RestApi, configWithUid, schema, true);

			should(result).be.eql(existingVersion);
		});

		it('should create new version with jsApiVersion when version does not exist', async function () {
			const createdVersion = { runnerUid: 'runner-uid-1', version: '1.0.0' };
			const mockRestApi = {
				runner: {
					get: sinon.fake.resolves(existingRunner),
					update: sinon.fake.resolves(undefined),
					version: {
						get: sinon.fake.resolves(null),
						create: sinon.fake.resolves(createdVersion),
					},
				},
			};

			const schema = { input: {}, output: {}, telemetry: {} };
			const result = await ensureRunnerVersion(mockRestApi as unknown as RestApi, configWithUid, schema, true);

			should(result).be.eql(createdVersion);
			const createArgs = mockRestApi.runner.version.create.firstCall.args[0];
			should(createArgs.jsApiVersion).be.equal('5.0.0');
			should(createArgs.runnerUid).be.equal('runner-uid-1');
		});

		it('should throw when runner uid is not found', async function () {
			const mockRestApi = {
				runner: {
					get: sinon.fake.resolves(null),
				},
			};

			const schema = { input: {}, output: {}, telemetry: {} };
			await should(ensureRunnerVersion(mockRestApi as unknown as RestApi, configWithUid, schema, true)).be.rejectedWith(
				/Runner with uid "runner-uid-1" not found/,
			);
		});
	});
});
