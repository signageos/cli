import should from 'should';
import * as sinon from 'sinon';

const rewireMock = require('rewiremock').default;

const createDevelopmentWithOptionsStub = sinon.stub();
const deviceConnectStub = sinon.stub();
const appletServeStub = sinon.stub();

rewireMock('../../Organization/organizationFacade').with({
	getOrganizationUidOrDefaultOrSelect: sinon.fake.resolves('organization-uid'),
	ORGANIZATION_UID_OPTION: { name: 'organization-uid', type: String },
	NO_DEFAULT_ORGANIZATION_OPTION: { name: 'no-default-organization', type: Boolean },
});
rewireMock('../../Organization/organizationRestApi').with({
	createOrganizationRestApiFromUid: sinon.fake.resolves({}),
});
rewireMock('../../Applet/appletFacade').with({
	getAppletUid: sinon.fake.resolves('applet-uid'),
	getAppletVersion: sinon.fake.resolves('1.0.0'),
	APPLET_UID_OPTION: { name: 'applet-uid', type: String },
});
rewireMock('../deviceFacade').with({
	getDeviceUid: sinon.fake.resolves('device-uid'),
	DEVICE_UID_OPTION: { name: 'device-uid', type: String },
});
rewireMock('../../Applet/appletServerHelper').with({
	killAppletServerIfRunningAndForceOption: sinon.fake.resolves(undefined),
	SERVER_PUBLIC_URL_OPTION: { name: 'server-public-url', type: String },
	SERVER_PORT_OPTION: { name: 'server-port', type: Number },
	SERVER_FORCE_OPTION: { name: 'force', type: Boolean },
	DETACH_PROCESS_OPTION: { name: 'detach', type: Boolean },
	FORWARD_SERVER_URL_OPTION: { name: 'forward-server-url', type: String },
	HOT_RELOAD_OPTION: { name: 'hot-reload', type: Boolean },
});
rewireMock('../../Applet/Upload/appletUploadCommandHelper').with({
	getAppletDirectoryAbsolutePath: sinon.fake.resolves('/tmp/applet'),
	APPLET_PATH_OPTION: { name: 'applet-path', type: String },
});
rewireMock('../../Development/developmentFactory').with({
	createDevelopmentWithOptions: createDevelopmentWithOptionsStub,
});
rewireMock('../../RunControl/runControlHelper').with({
	loadConfig: sinon.fake.resolves({
		identification: 'organization-client-id',
		apiSecurityToken: 'organization-secret',
	}),
});
rewireMock('../../helper').with({
	getApiUrl: sinon.fake.returns('https://api.signageos.io'),
});
rewireMock('../../Timer/wait').with(sinon.fake.resolves(undefined));
rewireMock.enable();
import { connect } from '../../../../src/Device/Connect/connectCommand';
rewireMock.disable();

describe('connectCommand', function () {
	it('should connect with organization credentials', async function () {
		const processOnStub = sinon.stub(process, 'on');
		createDevelopmentWithOptionsStub.resetHistory();
		deviceConnectStub.resetHistory();
		appletServeStub.resolves({
			port: 8090,
			publicUrl: 'http://localhost:8090',
			stop: sinon.fake.resolves(undefined),
		});
		deviceConnectStub.resolves(sinon.fake());
		createDevelopmentWithOptionsStub.returns({
			applet: {
				serve: {
					serve: appletServeStub,
				},
			},
			deviceConnect: {
				connect: deviceConnectStub,
			},
		});

		try {
			await connect.run({
				command: undefined,
				help: undefined,
				'api-url': undefined,
				version: undefined,
				profile: undefined,
				'organization-uid': 'organization-uid',
				'no-default-organization': undefined,
				'device-uid': 'device-uid',
				'applet-uid': 'applet-uid',
				'server-public-url': undefined,
				'server-port': undefined,
				force: undefined,
				detach: undefined,
				'use-forward-server': undefined,
				'forward-server-url': undefined,
				'hot-reload': undefined,
				'applet-path': undefined,
			});
		} finally {
			processOnStub.restore();
		}

		should(
			createDevelopmentWithOptionsStub.calledOnceWithExactly({
				organizationUid: 'organization-uid',
				url: 'https://api.signageos.io',
				accessToken: undefined,
				clientId: 'organization-client-id',
				secret: 'organization-secret',
			}),
		).be.true();
		should(deviceConnectStub.calledOnce).be.true();
	});
});
