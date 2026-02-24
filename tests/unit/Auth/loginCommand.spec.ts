import should from 'should';
import { getIsAuth0Enabled } from '../../../src/Auth/loginCommand';

describe('Auth.loginCommand', function () {
	describe('getIsAuth0Enabled', function () {
		it('should return true if --auth0-enabled is present', function () {
			const { isAuth0Enabled } = getIsAuth0Enabled({ _unknown: ['--auth0-enabled'], command: ['login'] });

			should(isAuth0Enabled).be.true();
		});

		it('should return undefined (server default) if --auth0-enabled is NOT present', function () {
			const { isAuth0Enabled } = getIsAuth0Enabled({});

			should(isAuth0Enabled).be.undefined();
		});
	});
});
