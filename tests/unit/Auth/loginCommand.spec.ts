import should from 'should';

describe('Auth.loginCommand', function () {
	it('should export a login command definition', async function () {
		const mod = await import('../../../src/Auth/loginCommand.js');
		const { login } = mod.default ?? mod;
		should(login).have.property('name', 'login');
		should(login).have.property('description');
		should(login).have.property('run').which.is.a.Function();
	});

	it('should have an empty optionList', async function () {
		const mod = await import('../../../src/Auth/loginCommand.js');
		const { login } = mod.default ?? mod;
		should(login).have.property('optionList').which.is.an.Array();
		should(login.optionList).have.length(0);
	});

	it('should have a description mentioning Auth0', async function () {
		const mod = await import('../../../src/Auth/loginCommand.js');
		const { login } = mod.default ?? mod;
		should(login.description).be.a.String();
		should(login.description.toLowerCase()).containEql('auth0');
	});
});
