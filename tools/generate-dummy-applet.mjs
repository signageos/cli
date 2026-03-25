/**
 * Generates a minimal dummy applet for upload/integration tests.
 *
 * Produces exactly what `applet upload` needs:
 *   <OUTPUT_DIR>/package.json       - applet manifest
 *   <OUTPUT_DIR>/dist/index.html    - entry file
 *   <OUTPUT_DIR>/dist/assets/*.svg  - filler assets
 *
 * No bundler, no npm install, no external tools required.
 *
 * Usage: node ./tools/generate-dummy-applet.mjs [options]
 *   --size=<MB>     Approximate large SVG size in MB (default: 100)
 *   --files=<n>     Number of small SVG files to generate (default: 64)
 *   --name=<name>   Output dir name inside tests/output/ (default: uploadTest)
 */

import fs from 'fs-extra';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'node:util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { values: args } = parseArgs({
options: {
size: { type: 'string' },
files: { type: 'string' },
name: { type: 'string' },
},
});

const LARGE_SIZE_MB = Number.parseInt(args.size, 10) || 100;
const NUM_FILES = Number.parseInt(args.files, 10) || 64;
const OUTPUT_NAME = args.name || 'uploadTest';
const OUTPUT_DIR = path.join(__dirname, '..', 'tests', 'output', OUTPUT_NAME);
const DIST_DIR = path.join(OUTPUT_DIR, 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');

function generateSvgContent(index, paddingLength = 4) {
	const r = Math.floor(Math.random() * 256);
	const g = Math.floor(Math.random() * 256);
	const b = Math.floor(Math.random() * 256);
	const padded = String(index).padStart(paddingLength, '0');
	return `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="rgb(${r},${g},${b})" />
  <text x="50" y="50" font-size="12" text-anchor="middle" fill="white">${padded}</text>
</svg>`;
}

async function generateSmallSvgs() {
	console.info(`Generating ${NUM_FILES} small SVG assets...`);
	await fs.ensureDir(ASSETS_DIR);
	const paddingLength = String(NUM_FILES - 1).length;
	const BATCH = 10;
	for (let i = 0; i < NUM_FILES; i += BATCH) {
		const writes = [];
		for (let j = i; j < Math.min(i + BATCH, NUM_FILES); j++) {
			const padded = String(j).padStart(paddingLength, '0');
			writes.push(fs.writeFile(path.join(ASSETS_DIR, `asset_${padded}.svg`), generateSvgContent(j, paddingLength)));
		}
		await Promise.all(writes);
		process.stdout.write(`\r  ${Math.round((Math.min(i + BATCH, NUM_FILES) / NUM_FILES) * 100)}%`);
	}
	console.info('\n  Done.');
}

async function generateLargeSvg() {
	console.info(`Generating large SVG (~${LARGE_SIZE_MB} MB)...`);
	await fs.ensureDir(ASSETS_DIR);
	const filePath = path.join(ASSETS_DIR, 'large-file.svg');
	const ws = createWriteStream(filePath);
	const pathCount = Math.ceil((LARGE_SIZE_MB / 100) * 25000);
	const BATCH = 1000;
	ws.write('<svg width="10000" height="10000" xmlns="http://www.w3.org/2000/svg">');
	try {
		for (let i = 0; i < pathCount; i += BATCH) {
			let chunk = '';
			for (let j = i; j < Math.min(i + BATCH, pathCount); j++) {
				let d = 'M';
				for (let k = 0; k < 100; k++) {
					d += ` ${(Math.random() * 9999).toFixed(10)},${(Math.random() * 9999).toFixed(10)}`;
					d += k % 3 === 0 ? ' L' : k % 3 === 1 ? ' Q' : ' T';
				}
				const color = `rgb(${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)})`;
				chunk += `<path d="${d}" stroke="${color}" fill="none" stroke-width="${(Math.random() * 10).toFixed(2)}" />`;
				if (j % 5 === 0) {
					const txt = Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('');
					chunk += `<text x="${(Math.random() * 4900).toFixed(2)}" y="${(Math.random() * 4900).toFixed(2)}" font-size="10">${txt}</text>`;
				}
			}
			ws.write(chunk);
			process.stdout.write(`\r  ${Math.round((Math.min(i + BATCH, pathCount) / pathCount) * 100)}%`);
		}
		ws.write('</svg>');
		ws.end();
		await new Promise((resolve, reject) => {
			ws.on('finish', resolve);
			ws.on('error', reject);
		});
		const { size } = await fs.stat(filePath);
		console.info(`\n  Done (${(size / 1024 / 1024).toFixed(2)} MB).`);
	} catch (err) {
		ws.destroy();
		throw err;
	}
}

async function main() {
	console.info(`\nGenerating dummy applet "${OUTPUT_NAME}" (${NUM_FILES} SVGs + ~${LARGE_SIZE_MB} MB large file)...`);
	await fs.ensureDir(OUTPUT_DIR);
	await fs.writeJSON(
path.join(OUTPUT_DIR, 'package.json'),
{ name: OUTPUT_NAME, version: '0.0.1', main: 'dist/index.html', dependencies: { '@signageos/front-applet': 'latest' }, sos: {} },
{ spaces: 2 },
);
	await fs.ensureDir(DIST_DIR);
	await fs.writeFile(
path.join(DIST_DIR, 'index.html'),
`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Dummy Applet</title></head>
<body><p>Dummy applet for upload testing (${NUM_FILES} assets, ~${LARGE_SIZE_MB} MB large file).</p></body>
</html>`,
);
	await generateSmallSvgs();
	await generateLargeSvg();
	console.info(`\n✨ Done → ${OUTPUT_DIR}`);
}

await main().catch((err) => {
	console.error('\n❌', err.message);
	process.exit(1);
});
