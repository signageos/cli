import should from 'should';
import * as sinon from 'sinon';
const rewireMock = require('rewiremock').default;
import firmwareUploadFacadeMock from './firmwareUploadFacadeMock';
import validateFileExistenceSync from './firmwareUploadHelperMock';
import createFirmwareVersionRestApi from './firmwareUploadRestApiMock';

rewireMock.enable();
rewireMock('./firmwareUploadHelper').with(validateFileExistenceSync);
rewireMock('./firmwareUploadFacade').with(firmwareUploadFacadeMock);
rewireMock('../../helper').with(createFirmwareVersionRestApi);

import { firmwareUpload as firmwareUploadMock } from '../../../src/Firmware/Upload/firmwareUploadCommand';
import { generalOptions } from '../helperMock';

rewireMock.disable();

describe('unit.firmwareUploadCommand', function () {
	beforeEach(function () {
		sinon.reset();
	});

	it('should upload firmware version: Task succeeded', async function () {
		await firmwareUploadMock.run({
			...generalOptions,
			'firmware-type': undefined,
			force: undefined,
			'application-type': 'webos',
			'firmware-version': '1.1.1',
			src: ['/valid.apk'],
		});
		should(firmwareUploadFacadeMock.uploadFirmwareVersion.calledOnce).be.true();
	});

	it('should not upload firmware version because of invalid files: Task failed', async function () {
		try {
			await firmwareUploadMock.run({
				...generalOptions,
				'firmware-type': undefined,
				force: undefined,
				'application-type': 'webos',
				'firmware-version': '1.1.1',
				src: ['/what evers'],
			});
			should(false).true();
		} catch {
			should(true).true();
		}
	});
});
