import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import should from 'should';
import * as sinon from 'sinon';
import { getAppletVersionFromApi } from '../../../src/Applet/appletFacade';
import { createPage } from '../helper/createPage';

describe('appletFacade', function () {
	describe('getAppletVersionFromApi', function () {
		it('should detect multiple versions when they are spread across pages', async function () {
			// Page 1 returns one version, page 2 returns another.
			// Without pagination: length === 1 triggers the auto-select fast path → '1.0.0' is wrongly returned.
			// With pagination: both pages are consumed → length === 2 → must throw.
			const page2 = createPage([{ version: '2.0.0' }]);
			const page1 = createPage([{ version: '1.0.0' }], page2);

			const mockRestApi = {
				applet: { version: { list: sinon.fake.resolves(page1) } },
			};

			await should(getAppletVersionFromApi(mockRestApi as unknown as RestApi, 'test-uid', true)).be.rejectedWith(
				/Multiple applet versions found/,
			);
		});

		it('should return a version that exists only on the second page', async function () {
			// Page 1 is empty, page 2 has '1.0.0'.
			// Without pagination: length === 0 → skipConfirmation throws (wrong behaviour).
			// With pagination: exactly 1 version is found → '1.0.0' is returned.
			const page2 = createPage([{ version: '1.0.0' }]);
			const page1 = createPage([], page2);

			const mockRestApi = {
				applet: { version: { list: sinon.fake.resolves(page1) } },
			};

			const result = await getAppletVersionFromApi(mockRestApi as unknown as RestApi, 'test-uid', true);
			should(result).equal('1.0.0');
		});
	});
});
