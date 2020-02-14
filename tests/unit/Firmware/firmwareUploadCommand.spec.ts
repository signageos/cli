import * as should from 'should';
import * as sinon from 'sinon';
import rewireMock from 'rewiremock';
import firmwareUploadFacadeMock from './firmwareUploadFacadeMock';
import validateFileExistenceSync from './firmwareUploadHelperMock';
import createFirmwareVersionRestApi from './firmwareUploadRestApiMock';

rewireMock.enable();
rewireMock('./firmwareUploadHelper').with(validateFileExistenceSync);
rewireMock('./firmwareUploadFacade').with(firmwareUploadFacadeMock);
rewireMock('../../helper').with(createFirmwareVersionRestApi);

import { firmwareUpload as firmwareUploadMock } from '../../../src/Firmware/Upload/firmwareUploadCommand';

rewireMock.disable();

describe('unit.firmwareUploadCommand', () => {
	beforeEach(() => {
		sinon.reset();
	});
	it('should upload firmware version: Task succeeded', async () => {
		await firmwareUploadMock.run({
			'application-type': 'webos',
			'firmware-version': '1.1.1',
			'src': ['/valid.apk'],
		});
		should(firmwareUploadFacadeMock.uploadFirmwareVersion.calledOnce).be.true();
	});
	it('should not upload firmware version because of invalid files: Task failed', async () => {
		await firmwareUploadMock.run({
			'application-type': 'webos',
			'firmware-version': '1.1.1',
			'src': ['/what evers'],
		});
		should(firmwareUploadFacadeMock.uploadFirmwareVersion.calledOnce).be.false();
	});
});
