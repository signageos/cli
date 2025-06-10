const chalk = require('chalk');
const fs = require('fs');
const os = require('os');
const path = require('path');
const version = require('./package.json').version;

// Environment detection
const env = process.env;
const SILENT = ['silent', 'error', 'warn'].indexOf(env.npm_config_loglevel) !== -1;

// CI environment detection
const CI = ['BUILD_NUMBER', 'CI', 'CONTINUOUS_INTEGRATION', 'DRONE', 'RUN_ID', 'GITHUB_ACTIONS'].some(function (it) {
	return !!env[it];
});

function isBannerRequired() {
	if (CI || SILENT) {
		return false;
	}

	const file = path.join(os.tmpdir(), 'signageos-cli-last-display');

	try {
		// Check if the file exists and is less than 24h old
		const stats = fs.statSync(file);
		const lastDisplayed = new Date(stats.mtime).getTime();
		const now = Date.now();

		// If displayed in the last 24 hours, don't show again
		if (now - lastDisplayed < 86400000) {
			return false;
		}
	} catch (_error) {
		// File doesn't exist or can't be read, show the banner
	}

	try {
		// Update the timestamp
		fs.writeFileSync(file, version, 'utf8');
	} catch (_error) {
		// Fail silently if we can't write
	}

	return true;
}

function printWelcomeMessage() {
	// Helper function to pad lines to exactly 80 characters between borders
	const formatLine = (/** @type {string} */ text) => {
		// Calculate visible length (excluding ANSI color codes)
		const plainText = text.replace(/\u001b\[\d+m/g, '');
		const paddingLength = 78 - plainText.length;
		return text + ' '.repeat(Math.max(0, paddingLength));
	};

	const message = [
		'╔══════════════════════════════════════════════════════════════════════════════╗',
		'║' + formatLine('') + '║',
		'║' + formatLine(`  ${chalk('signageOS CLI').bold} v${version}`) + '║',
		'║' + formatLine('') + '║',
		'║' + formatLine('  ╭──────────────────────────────────╮') + '║',
		'║' + formatLine('  │ $ sos <tab>                      │') + '║',
		'║' + formatLine('  │ command1  command2  command3     │') + '║',
		'║' + formatLine('  ╰──────────────────────────────────╯') + '║',
		'║' + formatLine('') + '║',
		'║' + formatLine('  🎉 NEW FEATURE: Command Autocomplete') + '║',
		'║' + formatLine(`  Type ${chalk.green(chalk.bold('sos <command>'))} and press ${chalk.green(chalk.bold('TAB'))} to`) + '║',
		'║' + formatLine('  explore available commands and options.') + '║',
		'║' + formatLine('') + '║',
		'║' + formatLine('  Enable Autocomplete:') + '║',
		'║' + formatLine(`  $ ${chalk.green(chalk.bold('sos autocomplete install'))}`) + '║',
		'║' + formatLine('') + '║',
		'╚══════════════════════════════════════════════════════════════════════════════╝',
	];

	console.info(message.join('\n'));
}

function printSignageosLogo() {
	const logo = [
		`░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░`,
		`░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░`,
		`░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░`,
		`░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░`,
		`░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░▒▒░░░░`,
		`░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒░░░░░░░░░░░░░░░░░░░░░░░░▒▒░░░░`,
		`░░░░░░░░░░░▒▒░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒████▓░░░░▓████▒░░░░▒▒░░░░`,
		`░░░░░▓███▓░▓█░░▓███▓▓░▒█▒███░░░███▒█▒░░███▒█▒░░███▓░░▓█░░░░▒█░░█▓░░░░░░░░░▒▒░░░░`,
		`░░░░░█▓░░░░▓█░▓█░░░▓█░▒█░░░█▓░█▓░░░█▒░█▒░░░█▒░█▓▒▒█▓░█▓░░░░░█▓░░████▒░░░░░▒▒░░░░`,
		`░░░░░░░░▓█░▓█░▒█░░░██░▒█░░░█▓░█▓░░▒█▒░█▓░░▓█▒░█▒░░░░░██░░░░▒█░░░░░░░██░░░░▒▒░░░░`,
		`░░░░░▒▓█▓░░▒▓░░░▒▒░▓█░░▓░░░▓▒░░▒█▓░▓▒░░▒▒▒░█▒░░▒▓█▓░░░▒█████░░░▓█████░░░░░▒▒░░░░`,
		`░░░░░░░░░░░░░░░▓▓▓▓█▒░░░░░░░░░░░░░░░░░▒█▓▓██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒░░░░`,
		`░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░`,
		`░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░`,
		`░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░`,
	];

	console.info(logo.join('\n'));
}

// Only run if the banner should be displayed
if (isBannerRequired()) {
	try {
		printSignageosLogo();
		printWelcomeMessage();
	} catch (_error) {
		// Fail silently in case of errors
	}
}
