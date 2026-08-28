import { createOrganizationRestApi } from '../helper';
import { loadConfig } from '../RunControl/runControlHelper';
import { getOrganization } from './organizationFacade';

/**
 * Creates an organization-level RestApi from an organization UID.
 *
 * When explicit legacy credentials (identification + apiSecurityToken) are configured, the
 * organization fetch is skipped entirely — the credentials already carry the organization
 * identity, and org-scoped tokens cannot call the organization endpoint (403).
 */
export async function createOrganizationRestApiFromUid(organizationUid: string) {
	const config = await loadConfig();
	const hasExplicitLegacyCredentials = !config.accessToken && !!config.identification && !!config.apiSecurityToken;
	if (hasExplicitLegacyCredentials) {
		return createOrganizationRestApi(undefined);
	}
	return createOrganizationRestApi(await getOrganization(organizationUid));
}
