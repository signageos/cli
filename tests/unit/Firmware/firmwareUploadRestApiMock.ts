import * as sinon from 'sinon';

const restApi = {
	firmwareApi: {},
};

export default {
	createFirmwareVersionRestApi: sinon.fake(() => restApi),
};
