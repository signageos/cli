const fs = require('fs-extra');
const path = require('path');

const SOURCE_DIR = path.resolve(__dirname, '../src/Applet/Generate/Templates');
const DEST_DIR = path.resolve(__dirname, '../dist/Applet/Generate/Templates');

async function copyTemplates() {
	try {
		// Ensure the destination directory exists
		await fs.ensureDir(DEST_DIR);

		// Copy all contents from the source directory to the destination directory
		await fs.copy(SOURCE_DIR, DEST_DIR);

		console.log(`Tempaltes copied successfully!`);
	} catch (err) {
		console.error('Error copying templates:', err);
		process.exit(1);
	}
}

copyTemplates();
