import { loadPackage } from '@signageos/sdk/dist/FileSystem/packageConfig';
import chalk from 'chalk';

/**
 * Checks if the given directory appears to be a valid signageOS applet directory.
 *
 * A valid applet has @signageos/front-applet as a dependency.
 * This is the definitive marker that distinguishes applets from other projects.
 *
 * @param directoryPath - The directory path to validate
 * @returns true if the directory appears to be a valid applet, false otherwise
 */
export async function isValidAppletDirectory(directoryPath: string): Promise<boolean> {
	try {
		const packageJSONObject = await loadPackage(directoryPath);

		if (!packageJSONObject) {
			return false;
		}

		// Check for @signageos/front-applet dependency
		// If package has it, it's an applet
		const hasFrontApplet = !!(
			packageJSONObject.dependencies?.['@signageos/front-applet'] || packageJSONObject.devDependencies?.['@signageos/front-applet']
		);

		return hasFrontApplet;
	} catch {
		// If we can't load package.json or it's malformed, it's not a valid applet
		return false;
	}
}

/**
 * Validates that the directory is a valid applet directory and throws an error if not.
 *
 * @param directoryPath - The directory path to validate
 * @throws {Error} If the directory is not a valid applet directory
 */
export async function validateAppletDirectory(directoryPath: string): Promise<void> {
	const isValid = await isValidAppletDirectory(directoryPath);

	if (!isValid) {
		throw new Error(
			chalk.red(`\nThe directory does not appear to be a valid signageOS applet:\n`) +
				chalk.white(`  ${directoryPath}\n\n`) +
				chalk.yellow(`A valid applet must have ${chalk.green('@signageos/front-applet')} as a dependency.\n\n`),
		);
	}
}
