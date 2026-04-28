import should from 'should';

describe('Auth.logoutCommand', function () {
	it('should export a logout command definition', async function () {
		const mod = await import('../../../src/Auth/logoutCommand.js');
		const { logout } = mod.default ?? mod;
		should(logout).have.property('name', 'logout');
		should(logout).have.property('description');
		should(logout).have.property('run').which.is.a.Function();
	});

	it('should have an empty optionList', async function () {
		const mod = await import('../../../src/Auth/logoutCommand.js');
		const { logout } = mod.default ?? mod;
		should(logout).have.property('optionList').which.is.an.Array();
		should(logout.optionList).have.length(0);
	});
});
