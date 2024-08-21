import * as sinon from 'sinon';

export default {
	uploadFirmwareVersion: sinon.fake((_: any) => {
		return true;
	}),
};
