/**
 * Script to generate SVG assets and import them via CSS
 * Usage: node ./tools/generate-dummy-applet.mjs [options]
 * Options:
 *   --size=<size>    Size in MB for the large SVG (default: 100)
 *   --files=<count>  Number of SVG files to generate (default: 64)
 *   --name=<name>    Name of the output directory (default: uploadTest)
 */

import fs from 'fs-extra';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { $ } from 'zx';
import { parseArgs } from 'node:util';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const { values: args } = parseArgs({
	options: {
		size: { type: 'string' },
		files: { type: 'string' },
		name: { type: 'string' }
	}
});

// Configuration with CLI overrides
const config = {
	LARGE_SIZE: parseInt(args.size, 10) || 100, 
	NUM_FILES: parseInt(args.files, 10) || 64,
	OUTPUT_NAME: args.name || 'uploadTest',
	get OUTPUT_DIR() { return path.join(__dirname, '..', 'tests', 'output', this.OUTPUT_NAME); },
	get SRC_DIR() { return path.join(this.OUTPUT_DIR, 'src'); },
	get ASSETS_DIR() { return path.join(this.SRC_DIR, 'assets'); }
};

/**
 * Generate a simple SVG file with unique content
 * @param {number} index - Index of the SVG file
 * @param {number} paddingLength - Length for zero-padding
 * @returns {string} SVG content
 */
function generateSvgContent(index, paddingLength = 4) {
	const red = Math.floor(Math.random() * 256);
	const green = Math.floor(Math.random() * 256);
	const blue = Math.floor(Math.random() * 256);
	const paddedIndex = String(index).padStart(paddingLength, '0');

	return `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
	<!-- Asset ${paddedIndex} -->
	<rect width="100" height="100" fill="rgb(${red},${green},${blue})" />
	<text x="50" y="50" font-family="Arial" font-size="12" text-anchor="middle" fill="white">Asset ${paddedIndex}</text>
</svg>`;
}

/**
 * Generate a large SVG file using streams for better memory efficiency
 * @param {number} targetSizeMB - Target file size in MB
 * @returns {Promise<string>} Path to the generated file
 */
async function generateLargeSvg(targetSizeMB = config.LARGE_SIZE) {
	console.info(`Generating large SVG file (approx. ${targetSizeMB}MB)...`);

	// Ensure the assets directory exists
	await fs.ensureDir(config.ASSETS_DIR);
	
	const filePath = path.join(config.ASSETS_DIR, 'large-file.svg');
	const writeStream = createWriteStream(filePath);
	
	// Calculate initial path count based on target size
	const pathCount = Math.ceil((targetSizeMB / 100) * 25000);
	
	// Write SVG header
	writeStream.write(`<svg width="10000" height="10000" xmlns="http://www.w3.org/2000/svg">`);
	
	// Use batched writing to avoid memory issues
	const BATCH_SIZE = 1000;
	
	try {
		for (let i = 0; i < pathCount; i += BATCH_SIZE) {
			let batchContent = '';
			const batchEnd = Math.min(i + BATCH_SIZE, pathCount);
			
			for (let j = i; j < batchEnd; j++) {
				// Generate a unique, random path with many points
				let pathData = 'M';
				for (let k = 0; k < 100; k++) {
					const x = (Math.random() * 9999).toFixed(10);
					const y = (Math.random() * 9999).toFixed(10);
					pathData += ` ${x},${y}`;
					
					// Alternate between different path commands
					if (k % 3 === 0) pathData += ' L';
					else if (k % 3 === 1) pathData += ' Q';
					else pathData += ' T';
				}
				
				// Random color with high entropy
				const color = `rgb(${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)})`;
				batchContent += `<path d="${pathData}" stroke="${color}" fill="none" stroke-width="${Math.random() * 10}" opacity="${Math.random()}" />`;
				
				// Add more text elements with longer strings
				if (j % 5 === 0) {
					const randomText = [...Array(32)].map(() => Math.random().toString(36)[2]).join('');
					batchContent += `<text x="${Math.random() * 4900}" y="${Math.random() * 4900}" font-size="10">${randomText}</text>`;
				}
				
				// Show progress
				if (j % (pathCount / 10) < BATCH_SIZE) {
					const progress = Math.round((j / pathCount) * 100);
					process.stdout.write(`\rProgress: ${progress}%`);
				}
			}
			
			// Write the batch to the file
			writeStream.write(batchContent);
		}
		
		// Close the SVG tag
		writeStream.write('</svg>');
		writeStream.end();
		
		// Return a promise that resolves when the stream is closed
		await new Promise((resolve, reject) => {
			writeStream.on('finish', resolve);
			writeStream.on('error', reject);
		});
		
		// Check file size
		const stats = await fs.stat(filePath);
		const fileSizeMB = stats.size / (1024 * 1024);
		console.info(`\nGenerated large SVG file (${fileSizeMB.toFixed(2)}MB) at: ${filePath}`);
		
		return filePath;
	} catch (error) {
		writeStream.end();
		throw new Error(`Failed to generate large SVG: ${error.message}`);
	}
}

/**
 * Generate CSS file that imports all SVG assets
 */
async function generateCss() {
	// Ensure the src directory exists
	await fs.ensureDir(config.SRC_DIR);
	
	const cssContent = `/* Main index.css file with shared asset styles */

html, body {
	font-family: sans-serif;
	background-color: #f5f5f5;
	padding: 20px;
	height: 100%;
	overflow: auto;
}

h1 {
	color: #333;
}

.asset-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
	gap: 10px;
	margin-top: 20px;
}

/* Styles for large SVG file */
.asset-large {
	width: 200px;
	height: 200px;
	background-size: contain;
	background-repeat: no-repeat;
	background-position: center;
	border: 2px solid #ff0000;
	box-shadow: 0 4px 8px rgba(255,0,0,0.2);
	grid-column: 1 / span 2;
	grid-row: 1 / span 2;
}

/* Shared class for all regular assets - background set via inline style */
.asset-item {
	width: 100px;
	height: 100px;
	background-size: contain;
	background-repeat: no-repeat;
	background-position: center;
	border: 1px solid #ddd;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}`;

	await fs.writeFile(path.join(config.SRC_DIR, 'index.css'), cssContent);
}

/**
 * Generate TypeScript file that references the CSS
 */
async function generateTs() {
	// Ensure the src directory exists
	await fs.ensureDir(config.SRC_DIR);
	
	// Calculate padding length based on number of files
	const paddingLength = String(config.NUM_FILES - 1).length;
	
	const tsContent = `// Import CSS file with shared styles
import './index.css';

// Function to dynamically create elements for each asset
function createAssetElements() {
	const container = document.createElement('div');
	container.className = 'asset-grid';
	
	// Add the large file first
	const largeAssetDiv = document.createElement('div');
	largeAssetDiv.className = 'asset-large';
	largeAssetDiv.style.backgroundImage = 'url(\"./assets/large-file.svg\")';
	largeAssetDiv.title = 'Large SVG Asset (~${config.LARGE_SIZE}MB)';
	container.appendChild(largeAssetDiv);
	
	// Add the regular assets - set background-image via inline style with zero-padding
	for (let i = 0; i < ${config.NUM_FILES}; i++) {
		const paddedIndex = String(i).padStart(${paddingLength}, '0');
		const assetDiv = document.createElement('div');
		assetDiv.className = 'asset-item';
		assetDiv.style.backgroundImage = \`url("./assets/asset_\${paddedIndex}.svg")\`;
		assetDiv.title = \`Asset \${paddedIndex}\`;
		container.appendChild(assetDiv);
	}
	
	document.body.appendChild(container);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	const heading = document.createElement('h1');
	heading.textContent = 'Asset Test with ${config.NUM_FILES} SVG files + 1 large file';
	document.body.appendChild(heading);
	
	const description = document.createElement('p');
	description.textContent = 'This page includes ${config.NUM_FILES} regular SVG files and one large (~${config.LARGE_SIZE}MB) SVG file. All assets copied to dist folder.';
	document.body.appendChild(description);
	
	createAssetElements();
});`;

	await fs.writeFile(path.join(config.SRC_DIR, 'index.ts'), tsContent);
}

/**
 * Generate HTML file
 */
async function generateHtml() {
	// Ensure the output directory exists
	await fs.ensureDir(config.OUTPUT_DIR);
	
	const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>SVG Asset Test</title>
	<script src="./index.js"></script>
</head>
<body>
	<!-- Content will be created dynamically by JavaScript -->
</body>
</html>`;

	await fs.writeFile(path.join(config.OUTPUT_DIR, 'index.html'), htmlContent);
}

/**
 * Update rspack config to copy assets to dist folder
 */
async function updateRspackConfig() {
	const rspackConfigPath = path.join(config.OUTPUT_DIR, 'rspack.config.mjs');
	const configContent = await fs.readFile(rspackConfigPath, 'utf8');
	
	// Add CopyRspackPlugin to copy all assets to dist
	const updatedConfig = configContent.replace(
		`plugins: [`,
		`plugins: [
		new rspack.CopyRspackPlugin({
			patterns: [
				{
					from: 'src/assets',
					to: 'assets',
				},
			],
		}),`
	);
	
	await fs.writeFile(rspackConfigPath, updatedConfig);
	console.info('✅ Updated rspack config to copy assets to dist folder');
}

/**
 * Generate SVG asset files with progress display
 */
async function generateAssets() {
	console.info(`Generating ${config.NUM_FILES} SVG assets...`);
	
	// Ensure the assets directory exists
	await fs.ensureDir(config.ASSETS_DIR);
	
	// Calculate padding length based on number of files (e.g., 1200 files -> 4 digits)
	const paddingLength = String(config.NUM_FILES - 1).length;
	
	// Create assets in parallel batches for better performance
	const BATCH_SIZE = 10;
	for (let i = 0; i < config.NUM_FILES; i += BATCH_SIZE) {
		const batch = [];
		const batchEnd = Math.min(i + BATCH_SIZE, config.NUM_FILES);
		
		for (let j = i; j < batchEnd; j++) {
			const paddedIndex = String(j).padStart(paddingLength, '0');
			batch.push(
				fs.writeFile(
					path.join(config.ASSETS_DIR, `asset_${paddedIndex}.svg`),
					generateSvgContent(j, paddingLength)
				)
			);
		}
		
		await Promise.all(batch);
		process.stdout.write(`\rProgress: ${Math.min(100, Math.round((batchEnd / config.NUM_FILES) * 100))}%`);
	}
	
	console.info('\nAll SVG assets generated successfully');
	
	// Generate the large SVG file
	await generateLargeSvg(config.LARGE_SIZE);
}

/**
 * Main execution function
 */
void async function main() {
	try {
		console.info(`Starting applet generation with ${config.NUM_FILES} files and ${config.LARGE_SIZE}MB large file in ${config.OUTPUT_NAME}`);
		
		// Create output directory first
		await fs.ensureDir(config.OUTPUT_DIR);
		
		// Generate applet template
		console.info('Generating applet template...');
		await $`npx tsx ./src/index.ts applet generate --name ${config.OUTPUT_NAME} --target-dir ${config.OUTPUT_DIR} --language javascript --bundler rspack --packager npm`;
		console.info('✅ Applet template generated successfully');

		// Update rspack config to copy assets
		await updateRspackConfig();

		// Generate all files
		await generateAssets();
		await Promise.all([
			generateCss(),
			generateTs(),
			generateHtml()
		]);

		// Build the applet
		console.info('Building applet...');
		// Run build command in the target directory using zx's cwd option
		await $({cwd: config.OUTPUT_DIR})`npm run build`;
		console.info('✅ Applet built successfully');

		console.info('✨ All files generated successfully!');
	} catch (error) {
		console.error('❌ Error:', error.message);
		console.error(error.stack);
		process.exit(1);
	}
}();
