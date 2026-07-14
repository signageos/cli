/** A predefined signageOS region the user can select during `sos login`. */
export interface PredefinedRegion {
	/** Stable identifier, also the value stored/selected. */
	name: string;
	/** Human-readable label shown in the selection prompt. */
	label: string;
	apiUrl: string;
	boxUrl: string;
	auth0Domain: string;
	auth0ClientId: string;
	auth0Audience: string;
	auth0Scope: string;
}

const DEFAULT_AUTH0_SCOPE = 'openid profile email offline_access';

/**
 * Predefined signageOS regions offered as choices on `sos login`.
 * The first entry (`default`) holds the production values and is the
 * default-highlighted choice. Its values match the `SOS_DEFAULT_*` package
 * defaults used when `~/.sosrc` has no connection fields, so behavior stays
 * backward compatible with master.
 * Add a new region by appending an entry here.
 */
export const PREDEFINED_REGIONS: PredefinedRegion[] = [
	{
		name: 'default',
		label: 'default',
		apiUrl: 'https://api.signageos.io',
		boxUrl: 'box.signageos.io',
		auth0Domain: 'auth0.signageos.io',
		auth0ClientId: '8AU8D3zJ4mK8gszZP3gZO0nv9DusSNjV',
		auth0Audience: 'https://sos-production.us.auth0.com/api/v2/',
		auth0Scope: DEFAULT_AUTH0_SCOPE,
	},
	{
		name: 'us1',
		label: 'us1',
		apiUrl: 'https://api.us1.signageos.io',
		boxUrl: 'box.us1.signageos.io',
		auth0Domain: 'auth0.us1.signageos.io',
		auth0ClientId: 'EhxXogFcVu85WaROrsMSqtALXVuNkxTc',
		auth0Audience: 'https://sos-production-us1.us.auth0.com/api/v2/',
		auth0Scope: DEFAULT_AUTH0_SCOPE,
	},
];

/** Look up a predefined region by its `name`. Returns `undefined` when not found. */
export function getPredefinedRegionByName(name: string): PredefinedRegion | undefined {
	return PREDEFINED_REGIONS.find((region) => region.name === name);
}
