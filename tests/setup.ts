/**
 * Test setup file - loads environment variables before tests run
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const environment = process.env.NODE_ENV || 'dev';
const envFile = environment === 'test' ? '.env.test' : '.env';
const rootPath = path.resolve(__dirname, '..');

console.info(`Loading environment from: ${envFile}`);
const result = dotenv.config({ path: path.join(rootPath, envFile) });

if (result.error) {
	console.error(`Failed to load ${envFile}:`, result.error);
} else {
	console.info(`✓ Environment loaded from ${envFile}`);
	console.info(`  SOS_API_URL: ${process.env.SOS_API_URL}`);
	console.info(`  SOS_API_IDENTIFICATION: ${process.env.SOS_API_IDENTIFICATION ? 'set' : 'not set'}`);
	console.info(`  SOS_API_SECURITY_TOKEN: ${process.env.SOS_API_SECURITY_TOKEN ? 'set' : 'not set'}`);
}
