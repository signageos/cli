import should from 'should';
import wait from '../../../src/Timer/wait';

describe('Timer.wait', function () {
	it('should resolve after the given timeout', async function () {
		const start = Date.now();
		await wait(50);
		const elapsed = Date.now() - start;
		should(elapsed).be.greaterThanOrEqual(40);
	});
});
