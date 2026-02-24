import should from 'should';
import { getErrorMessageFromUnknownError } from '../../src/helper';

describe('helper', function () {
	describe('getErrorMessageFromUnknownError', function () {
		it('should return error message from Error object', function () {
			const error = new Error('Test error message');
			const result = getErrorMessageFromUnknownError(error);
			should(result).be.equal('Test error message');
		});

		it('should return error message from object with message property', function () {
			const error = { message: 'Custom error message' };
			const result = getErrorMessageFromUnknownError(error);
			should(result).be.equal('Custom error message');
		});

		it('should return string representation of string error', function () {
			const error = 'String error';
			const result = getErrorMessageFromUnknownError(error);
			should(result).be.equal('String error');
		});

		it('should return string representation of number error', function () {
			const error = 404;
			const result = getErrorMessageFromUnknownError(error);
			should(result).be.equal('404');
		});

		it('should return string representation of object without message', function () {
			const error = { code: 'ERR_001', status: 500 };
			const result = getErrorMessageFromUnknownError(error);
			should(result).be.equal('[object Object]');
		});

		it('should return null for null error', function () {
			const result = getErrorMessageFromUnknownError(null);
			should(result).be.null();
		});

		it('should return null for undefined error', function () {
			const result = getErrorMessageFromUnknownError(undefined);
			should(result).be.null();
		});

		it('should handle object with non-string message property', function () {
			const error = { message: 42 };
			const result = getErrorMessageFromUnknownError(error);
			should(result).be.equal(42);
		});

		it('should handle object with null message property', function () {
			const error = { message: null };
			const result = getErrorMessageFromUnknownError(error);
			should(result).be.equal(null);
		});
	});
});
