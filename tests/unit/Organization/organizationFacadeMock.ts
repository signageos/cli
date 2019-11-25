import * as sinon from 'sinon';
import { ORGANIZATION_UID_OPTION } from '../../../src/Organization/organizationFacade';

export default {
	getOrganization: sinon.fake(() => Promise.resolve({ fakeOrganization: true })),
	ORGANIZATION_UID_OPTION,
};
