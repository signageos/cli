import * as path from 'path';
import * as fs from 'fs-extra';
import should from 'should';
import * as sinon from 'sinon';
import { createEmulator } from '../../../src/Emulator/emulatorFactory';
import { useTmpFiles } from '../../lib/tmpFiles';
import type { Development } from '@signageos/sdk/dist/Development/Development';

describe('Emulator.emulatorFactory', function () {
	const tmpDir = useTmpFiles();

	describe('loadSosLocalConfig', function () {
		// We need to test the internal loadSosLocalConfig function through createEmulator
		// Since loadSosLocalConfig is not exported, we'll test it indirectly through the emulator behavior

		let logStub: sinon.SinonStub;
		let devMock: Partial<Development>;

		beforeEach(function () {
			// Mock the log function to capture warnings
			logStub = sinon.stub(require('@signageos/sdk/dist/Console/log'), 'log');

			// Create minimal dev mock
			devMock = {
				applet: {
					files: {
						listAppletFiles: sinon.stub().resolves([]),
					},
				},
			} as any;
		});

		afterEach(function () {
			logStub.restore();
		});

		it('should load valid JSON from sos.config.local.json', async function () {
			const appletPath = path.join(tmpDir, 'test-applet-valid');
			await fs.ensureDir(appletPath);

			const configContent = {
				apiKey: 'test-api-key',
				debugMode: true,
				timeout: 5000,
			};

			const configPath = path.join(appletPath, 'sos.config.local.json');
			await fs.writeFile(configPath, JSON.stringify(configContent, null, 2));

			// Create minimal required files
			const frontDisplayPath = path.join(appletPath, 'node_modules', '@signageos', 'front-display');
			await fs.ensureDir(path.join(frontDisplayPath, 'dist'));
			await fs.writeFile(path.join(frontDisplayPath, 'package.json'), '{}');
			await fs.writeFile(path.join(frontDisplayPath, 'dist', 'index.html'), '<html><head></head><body></body></html>');

			const entryFile = path.join(appletPath, 'index.html');
			await fs.writeFile(entryFile, '<html><head></head><body>Test</body></html>');

			const emulator = await createEmulator(
				{
					appletUid: 'test-uid',
					appletVersion: '1.0.0',
					appletPath,
					entryFileRelativePath: 'index.html',
					emulatorServerPort: 8099,
					emulatorUid: 'emulator-test-uid',
				},
				'test-org-uid',
				devMock as Development,
			);

			// The config should be loaded and injected into window.__SOS_BUNDLED_APPLET.config
			// We can verify this by making a request to the emulator
			const http = require('http');
			const response = await new Promise<string>((resolve, reject) => {
				http
					.get('http://localhost:8099/?duid=test-duid', (res: any) => {
						let data = '';
						res.on('data', (chunk: any) => (data += chunk));
						res.on('end', () => resolve(data));
					})
					.on('error', reject);
			});

			should(response).containEql('window.__SOS_BUNDLED_APPLET.config = {"apiKey":"test-api-key","debugMode":true,"timeout":5000}');

			await emulator.stop();
		});

		it('should return empty object when sos.config.local.json does not exist', async function () {
			const appletPath = path.join(tmpDir, 'test-applet-no-config');
			await fs.ensureDir(appletPath);

			// Create minimal required files
			const frontDisplayPath = path.join(appletPath, 'node_modules', '@signageos', 'front-display');
			await fs.ensureDir(path.join(frontDisplayPath, 'dist'));
			await fs.writeFile(path.join(frontDisplayPath, 'package.json'), '{}');
			await fs.writeFile(path.join(frontDisplayPath, 'dist', 'index.html'), '<html><head></head><body></body></html>');

			const entryFile = path.join(appletPath, 'index.html');
			await fs.writeFile(entryFile, '<html><head></head><body>Test</body></html>');

			const emulator = await createEmulator(
				{
					appletUid: 'test-uid',
					appletVersion: '1.0.0',
					appletPath,
					entryFileRelativePath: 'index.html',
					emulatorServerPort: 8098,
					emulatorUid: 'emulator-test-uid',
				},
				'test-org-uid',
				devMock as Development,
			);

			const http = require('http');
			const response = await new Promise<string>((resolve, reject) => {
				http
					.get('http://localhost:8098/?duid=test-duid', (res: any) => {
						let data = '';
						res.on('data', (chunk: any) => (data += chunk));
						res.on('end', () => resolve(data));
					})
					.on('error', reject);
			});

			should(response).containEql('window.__SOS_BUNDLED_APPLET.config = {}');

			await emulator.stop();
		});

		it('should return empty object and log warning when JSON is invalid', async function () {
			const appletPath = path.join(tmpDir, 'test-applet-invalid-json');
			await fs.ensureDir(appletPath);

			const configPath = path.join(appletPath, 'sos.config.local.json');
			await fs.writeFile(configPath, '{ invalid json }');

			// Create minimal required files
			const frontDisplayPath = path.join(appletPath, 'node_modules', '@signageos', 'front-display');
			await fs.ensureDir(path.join(frontDisplayPath, 'dist'));
			await fs.writeFile(path.join(frontDisplayPath, 'package.json'), '{}');
			await fs.writeFile(path.join(frontDisplayPath, 'dist', 'index.html'), '<html><head></head><body></body></html>');

			const entryFile = path.join(appletPath, 'index.html');
			await fs.writeFile(entryFile, '<html><head></head><body>Test</body></html>');

			const emulator = await createEmulator(
				{
					appletUid: 'test-uid',
					appletVersion: '1.0.0',
					appletPath,
					entryFileRelativePath: 'index.html',
					emulatorServerPort: 8097,
					emulatorUid: 'emulator-test-uid',
				},
				'test-org-uid',
				devMock as Development,
			);

			const http = require('http');
			const response = await new Promise<string>((resolve, reject) => {
				http
					.get('http://localhost:8097/?duid=test-duid', (res: any) => {
						let data = '';
						res.on('data', (chunk: any) => (data += chunk));
						res.on('end', () => resolve(data));
					})
					.on('error', reject);
			});

			should(response).containEql('window.__SOS_BUNDLED_APPLET.config = {}');

			// Verify warning was logged
			should(logStub.calledWith('warning')).be.true();
			const warningCall = logStub
				.getCalls()
				.find((call: any) => call.args[0] === 'warning' && call.args[1].includes('Failed to load sos.config.local.json'));
			should(warningCall).be.ok();

			await emulator.stop();
		});

		it('should return empty object when sos.config.local.json is empty', async function () {
			const appletPath = path.join(tmpDir, 'test-applet-empty-json');
			await fs.ensureDir(appletPath);

			const configPath = path.join(appletPath, 'sos.config.local.json');
			await fs.writeFile(configPath, '');

			// Create minimal required files
			const frontDisplayPath = path.join(appletPath, 'node_modules', '@signageos', 'front-display');
			await fs.ensureDir(path.join(frontDisplayPath, 'dist'));
			await fs.writeFile(path.join(frontDisplayPath, 'package.json'), '{}');
			await fs.writeFile(path.join(frontDisplayPath, 'dist', 'index.html'), '<html><head></head><body></body></html>');

			const entryFile = path.join(appletPath, 'index.html');
			await fs.writeFile(entryFile, '<html><head></head><body>Test</body></html>');

			const emulator = await createEmulator(
				{
					appletUid: 'test-uid',
					appletVersion: '1.0.0',
					appletPath,
					entryFileRelativePath: 'index.html',
					emulatorServerPort: 8096,
					emulatorUid: 'emulator-test-uid',
				},
				'test-org-uid',
				devMock as Development,
			);

			const http = require('http');
			const response = await new Promise<string>((resolve, reject) => {
				http
					.get('http://localhost:8096/?duid=test-duid', (res: any) => {
						let data = '';
						res.on('data', (chunk: any) => (data += chunk));
						res.on('end', () => resolve(data));
					})
					.on('error', reject);
			});

			should(response).containEql('window.__SOS_BUNDLED_APPLET.config = {}');

			// Verify warning was logged for empty JSON
			should(logStub.calledWith('warning')).be.true();

			await emulator.stop();
		});

		it('should handle nested configuration objects', async function () {
			const appletPath = path.join(tmpDir, 'test-applet-nested');
			await fs.ensureDir(appletPath);

			const configContent = {
				api: {
					key: 'test-key',
					endpoint: 'https://api.example.com',
					timeout: 3000,
				},
				features: {
					experimental: true,
					debug: false,
				},
			};

			const configPath = path.join(appletPath, 'sos.config.local.json');
			await fs.writeFile(configPath, JSON.stringify(configContent, null, 2));

			// Create minimal required files
			const frontDisplayPath = path.join(appletPath, 'node_modules', '@signageos', 'front-display');
			await fs.ensureDir(path.join(frontDisplayPath, 'dist'));
			await fs.writeFile(path.join(frontDisplayPath, 'package.json'), '{}');
			await fs.writeFile(path.join(frontDisplayPath, 'dist', 'index.html'), '<html><head></head><body></body></html>');

			const entryFile = path.join(appletPath, 'index.html');
			await fs.writeFile(entryFile, '<html><head></head><body>Test</body></html>');

			const emulator = await createEmulator(
				{
					appletUid: 'test-uid',
					appletVersion: '1.0.0',
					appletPath,
					entryFileRelativePath: 'index.html',
					emulatorServerPort: 8095,
					emulatorUid: 'emulator-test-uid',
				},
				'test-org-uid',
				devMock as Development,
			);

			const http = require('http');
			const response = await new Promise<string>((resolve, reject) => {
				http
					.get('http://localhost:8095/?duid=test-duid', (res: any) => {
						let data = '';
						res.on('data', (chunk: any) => (data += chunk));
						res.on('end', () => resolve(data));
					})
					.on('error', reject);
			});

			should(response).containEql('"api":{"key":"test-key","endpoint":"https://api.example.com","timeout":3000}');
			should(response).containEql('"features":{"experimental":true,"debug":false}');

			await emulator.stop();
		});
	});
});
