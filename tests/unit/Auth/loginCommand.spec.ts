import * as should from 'should';
import { getIsAuth0OrLegacyEnabled } from '../../../src/Auth/loginCommand';

describe('Auth.loginCommand', () => {
	describe('getIsAuth0OrLegacyEnabled', () => {
		it('should return true if --auth0-enabled is present', () => {
			const { isAuth0Enabled } = getIsAuth0OrLegacyEnabled({ _unknown: ['--auth0-enabled'], command: ['login'] });

			should(isAuth0Enabled).be.true();
		});

		it('should return true if --legacy-enabled is present', () => {
			const { isLegacyEnabled } = getIsAuth0OrLegacyEnabled({ _unknown: ['--legacy-enabled'], command: ['login'] });

			should(isLegacyEnabled).be.true();
		});

		it('should return undefined (server default) if --auth0-enabled is NOT present', () => {
			const { isAuth0Enabled } = getIsAuth0OrLegacyEnabled({});

			should(isAuth0Enabled).be.undefined();
		});

		it('should return undefined (server default) if --legacy-enabled is NOT present', () => {
			const { isLegacyEnabled } = getIsAuth0OrLegacyEnabled({});

			should(isLegacyEnabled).be.undefined();
		});

		it('should fail if both --auth0-enabled and --legacy-enabled are present', () => {
			should(() =>
				getIsAuth0OrLegacyEnabled({
					_unknown: ['--auth0-enabled', '--legacy-enabled'],
					command: ['login'],
				}),
			).throwError('Only one override from auth0 and legacy authentication options can be active at the moment.');
		});
	});
});
