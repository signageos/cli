// Template directories
const TEMPLATE_SOURCE_DIR = path.resolve(__dirname, '../src/Applet/Generate/Templates');
const TEMPLATE_DEST_DIR = path.resolve(__dirname, '../dist/Applet/Generate/Templates');

// Autocomplete script directories
const AUTOCOMPLETE_SOURCE_DIR = path.resolve(__dirname, '../src/Command/Autocomplete/Install');
const AUTOCOMPLETE_DEST_DIR = path.resolve(__dirname, '../dist/Command/Autocomplete/Install');

void async function copyTemplates() {
	try {
		// Ensure the destination directories exist
		await fs.ensureDir(TEMPLATE_DEST_DIR);
		await fs.ensureDir(AUTOCOMPLETE_DEST_DIR);

		// Copy all contents from the template directory
		await fs.copy(TEMPLATE_SOURCE_DIR, TEMPLATE_DEST_DIR);
		console.info(`Applet templates copied successfully!`);

		// Copy the autocomplete script
		await fs.copy(AUTOCOMPLETE_SOURCE_DIR, AUTOCOMPLETE_DEST_DIR);
		console.info(`Autocomplete scripts copied successfully!`);
	} catch (err) {
		console.error('Error copying files:', err);
		process.exit(1);
	}
};

copyTemplates();
