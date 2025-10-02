import 'should';
import { preprocessArgv } from '../../../src/Command/commandProcessor';

describe('Command.CommandProcessor', () => {
	describe('preprocessArgv', () => {
		it('should pass through valid single-char options', () => {
			const input = ['node', 'script.js', '-h', '-v', '-c'];
			const result = preprocessArgv(input);
			result.should.deepEqual(['node', 'script.js', '-h', '-v', '-c']);
		});

		it('should pass through valid double-dash options', () => {
			const input = ['node', 'script.js', '--help', '--version', '--config'];
			const result = preprocessArgv(input);
			result.should.deepEqual(['node', 'script.js', '--help', '--version', '--config']);
		});

		it('should throw error for common mistake -yes', () => {
			const input = ['node', 'script.js', '-yes'];
			(() => preprocessArgv(input)).should.throw(
				"Invalid option '-yes'. Did you mean '--yes'? Use double dashes for multi-character options.",
			);
		});

		it('should convert unknown multi-char option to double-dash', () => {
			const input = ['node', 'script.js', '-unknown'];
			const result = preprocessArgv(input);
			result.should.deepEqual(['node', 'script.js', '--unknown']);
		});

		it('should handle mixed valid and unknown options', () => {
			const input = ['node', 'script.js', '-h', '-unknown', '--valid'];
			const result = preprocessArgv(input);
			result.should.deepEqual(['node', 'script.js', '-h', '--unknown', '--valid']);
		});

		it('should pass through arguments without dashes', () => {
			const input = ['node', 'script.js', 'command', 'arg1', 'arg2'];
			const result = preprocessArgv(input);
			result.should.deepEqual(['node', 'script.js', 'command', 'arg1', 'arg2']);
		});

		it('should handle empty array', () => {
			const input: string[] = [];
			const result = preprocessArgv(input);
			result.should.deepEqual([]);
		});

		it('should throw error on first common mistake in mixed options', () => {
			const input = ['node', 'script.js', '-h', '-yes', '--valid'];
			(() => preprocessArgv(input)).should.throw(
				"Invalid option '-yes'. Did you mean '--yes'? Use double dashes for multi-character options.",
			);
		});

		it('should not affect single dash with single character', () => {
			const input = ['node', 'script.js', '-a', '-f'];
			const result = preprocessArgv(input);
			result.should.deepEqual(['node', 'script.js', '-a', '-f']);
		});

		it('should handle multiple unknown multi-char options', () => {
			const input = ['node', 'script.js', '-unknown1', '-unknown2'];
			const result = preprocessArgv(input);
			result.should.deepEqual(['node', 'script.js', '--unknown1', '--unknown2']);
		});

		it('should handle options with values', () => {
			const input = ['node', 'script.js', '-unknown', 'value', '--valid', 'value2'];
			const result = preprocessArgv(input);
			result.should.deepEqual(['node', 'script.js', '--unknown', 'value', '--valid', 'value2']);
		});
	});
});
