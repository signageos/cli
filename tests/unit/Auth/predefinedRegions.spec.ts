import should from 'should';

async function importRegions() {
	const mod = await import('../../../src/Auth/predefinedRegions.js');
	return mod.default ?? mod;
}

describe('Auth.predefinedRegions', function () {
	it('should export a non-empty PREDEFINED_REGIONS list', async function () {
		const { PREDEFINED_REGIONS } = await importRegions();
		should(PREDEFINED_REGIONS).be.an.Array();
		should(PREDEFINED_REGIONS.length).be.above(0);
	});

	it('should have all required connection fields on every region', async function () {
		const { PREDEFINED_REGIONS } = await importRegions();
		for (const region of PREDEFINED_REGIONS) {
			should(region.name).be.a.String().and.not.be.empty();
			should(region.label).be.a.String().and.not.be.empty();
			should(region.apiUrl).be.a.String().and.startWith('http');
			should(region.boxUrl).be.a.String().and.not.be.empty();
			should(region.auth0Domain).be.a.String().and.not.be.empty();
			should(region.auth0ClientId).be.a.String().and.not.be.empty();
			should(region.auth0Audience).be.a.String().and.not.be.empty();
			should(region.auth0Scope).be.a.String().and.not.be.empty();
		}
	});

	it('should have unique region names', async function () {
		const { PREDEFINED_REGIONS } = await importRegions();
		const names = PREDEFINED_REGIONS.map((region: { name: string }) => region.name);
		should(new Set(names).size).be.equal(names.length);
	});

	it('should default (first entry) to the production values under the "default" name (backward compatible)', async function () {
		const { PREDEFINED_REGIONS } = await importRegions();
		const [first] = PREDEFINED_REGIONS;
		if (!first) {
			throw new Error('PREDEFINED_REGIONS must not be empty');
		}
		should(first.name).be.equal('default');
		should(first.apiUrl).be.equal('https://api.signageos.io');
		should(first.boxUrl).be.equal('box.signageos.io');
		should(first.auth0Domain).be.equal('auth0.signageos.io');
	});

	it('should expose a "us1" region with the us1 connection values', async function () {
		const { getPredefinedRegionByName } = await importRegions();
		const us1 = getPredefinedRegionByName('us1');
		if (!us1) {
			throw new Error('Expected a "us1" predefined region');
		}
		should(us1.apiUrl).be.equal('https://api.us1.signageos.io');
		should(us1.auth0Domain).be.equal('auth0.us1.signageos.io');
	});

	it('should return undefined for unknown region names', async function () {
		const { getPredefinedRegionByName } = await importRegions();
		should(getPredefinedRegionByName('does-not-exist')).be.undefined();
	});
});
