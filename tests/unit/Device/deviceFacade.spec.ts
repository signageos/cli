import { default as IDevice } from '@signageos/sdk/dist/RestApi/Device/IDevice';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import should from 'should';
import * as sinon from 'sinon';
import { createPage } from '../helper/createPage';

const rewireMock = require('rewiremock').default;

// Mock prompts to select the first available choice.
// When choices is empty (pagination missing), prompts returns {} → function throws "selection was cancelled".
// When choices include the page-2 device (after fix), it returns { deviceUid: <first choice value> }.
rewireMock('prompts').with(async ({ choices }: { choices: Array<{ value: string }> }) => {
	const first = choices?.[0];
	return first ? { deviceUid: first.value } : {};
});
rewireMock.enable();
import { getDeviceUid } from '../../../src/Device/deviceFacade';
rewireMock.disable();

describe('deviceFacade', function () {
	describe('getDeviceUid', function () {
		it('should return a device that exists only on the second page', async function () {
			// Page 1 is empty. The only device is on page 2.
			// Without pagination: device.list() returns [], choices is empty, prompts returns {},
			//   function throws "Device selection was cancelled".
			// With pagination: both pages are consumed, device-on-page-2 appears in choices, returned.
			const page2 = createPage([{ uid: 'device-on-page-2', name: 'Page2Device', createdAt: new Date() } as IDevice]);
			const page1 = createPage([], page2);

			const mockRestApi = {
				device: {
					list: sinon.fake.resolves(page1),
				},
			};

			type Options = Parameters<typeof getDeviceUid>[1];
			const options: Options = {} as Options; // TODO: getDeviceUid should accept Partial options

			const result = await getDeviceUid(mockRestApi as unknown as RestApi, options, false);
			should(result).equal('device-on-page-2');
		});
	});
});
