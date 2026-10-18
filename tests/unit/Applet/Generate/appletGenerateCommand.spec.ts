import should from 'should';
import { buildInstallArgs, Packager } from '../../../../src/Applet/Generate/appletGenerateCommand';

describe('appletGenerateCommand', function () {
	describe('buildInstallArgs', function () {
		it('should install dev dependencies with npm', function () {
			should(buildInstallArgs(Packager.Npm, ['webpack@5'])).eql(['install', '--save-dev', 'webpack@5']);
		});

		it('should install dev dependencies with yarn', function () {
			should(buildInstallArgs(Packager.Yarn, ['webpack@5'])).eql(['add', '--save-dev', 'webpack@5']);
		});

		it('should install dev dependencies with pnpm', function () {
			should(buildInstallArgs(Packager.Pnpm, ['webpack@5'])).eql(['add', '--save-dev', 'webpack@5']);
		});

		// bun ignores `--save-dev` and writes the packages into `dependencies` instead.
		// Only `bun add --dev` puts them into `devDependencies`.
		it('should install dev dependencies with bun', function () {
			should(buildInstallArgs(Packager.Bun, ['webpack@5'])).eql(['add', '--dev', 'webpack@5']);
		});
	});
});
