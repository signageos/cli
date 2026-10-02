import 'should';
import { preprocessArgv, unknownCommandMessage } from '../../../src/Command/commandProcessor';

describe('Command.CommandProcessor', function () {
	describe('preprocessArgv', function () {
		it('should pass through valid single-char options', function () {
			const input = ['node', 'script.js', '-h', '-v', '-c'];
			const result = preprocessArgv(input);
			result.should.deepEqual(['node', 'script.js', '-h', '-v', '-c']);
		});

		it('should pass through valid double-dash options', function () {
			const input = ['node', 'script.js', '--help', '--version', '--config'];
			const result = preprocessArgv(input);
			result.should.deepEqual(['node', 'script.js', '--help', '--version', '--config']);
		});

		it('should throw error for common mistake -yes', function () {
			const input = ['node', 'script.js', '-yes'];
			(() => preprocessArgv(input)).should.throw(
				"Invalid option '-yes'. Did you mean '--yes'? Use double dashes for multi-character options.",
			);
		});

		it('should convert unknown multi-char option to double-dash', function () {
			const input = ['node', 'script.js', '-unknown'];
			const result = preprocessArgv(input);
			result.should.deepEqual(['node', 'script.js', '--unknown']);
		});

		it('should handle mixed valid and unknown options', function () {
			const input = ['node', 'script.js', '-h', '-unknown', '--valid'];
			const result = preprocessArgv(input);
			result.should.deepEqual(['node', 'script.js', '-h', '--unknown', '--valid']);
		});

		it('should pass through arguments without dashes', function () {
			const input = ['node', 'script.js', 'command', 'arg1', 'arg2'];
			const result = preprocessArgv(input);
			result.should.deepEqual(['node', 'script.js', 'command', 'arg1', 'arg2']);
		});

		it('should handle empty array', function () {
			const input: string[] = [];
			const result = preprocessArgv(input);
			result.should.deepEqual([]);
		});

		it('should throw error on first common mistake in mixed options', function () {
			const input = ['node', 'script.js', '-h', '-yes', '--valid'];
			(() => preprocessArgv(input)).should.throw(
				"Invalid option '-yes'. Did you mean '--yes'? Use double dashes for multi-character options.",
			);
		});

		it('should not affect single dash with single character', function () {
			const input = ['node', 'script.js', '-a', '-f'];
			const result = preprocessArgv(input);
			result.should.deepEqual(['node', 'script.js', '-a', '-f']);
		});

		it('should handle multiple unknown multi-char options', function () {
			const input = ['node', 'script.js', '-unknown1', '-unknown2'];
			const result = preprocessArgv(input);
			result.should.deepEqual(['node', 'script.js', '--unknown1', '--unknown2']);
		});

		it('should handle options with values', function () {
			const input = ['node', 'script.js', '-unknown', 'value', '--valid', 'value2'];
			const result = preprocessArgv(input);
			result.should.deepEqual(['node', 'script.js', '--unknown', 'value', '--valid', 'value2']);
		});
	});

	describe('unknownCommandMessage', function () {
		const COMMANDS = ['applet', 'login', 'logout', 'organization', 'timing', 'device', 'custom-script'];

		it('should suggest the nearest command for a typo', function () {
			unknownCommandMessage('logi', COMMANDS).should.equal("Unknown command: 'logi'. Did you mean 'login'?");
		});

		it('should suggest the nearest command for a missing letter', function () {
			unknownCommandMessage('aplet', COMMANDS).should.equal("Unknown command: 'aplet'. Did you mean 'applet'?");
		});

		it('should pick the closest of several similar commands', function () {
			unknownCommandMessage('logou', COMMANDS).should.equal("Unknown command: 'logou'. Did you mean 'logout'?");
		});

		it('should not suggest anything for input that resembles no command', function () {
			unknownCommandMessage('xyzzy', COMMANDS).should.equal("Unknown command: 'xyzzy'");
		});

		it('should ignore letter case', function () {
			unknownCommandMessage('Login', COMMANDS).should.equal("Unknown command: 'Login'. Did you mean 'login'?");
		});

		it('should not suggest anything when the command has no subcommands', function () {
			unknownCommandMessage('logi', []).should.equal("Unknown command: 'logi'");
		});
	});
});
