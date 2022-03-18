import { generalOptions } from "../../helperMock";

const defaultOptions = {
	...generalOptions,
	'update-package-config': undefined,
	'yes': undefined,
	'verbose': undefined,
	'no-default-organization': undefined,
	'entry-file-path': undefined,
	'applet-path': undefined,
} as const;

export const multiFileOptions = {
	...defaultOptions,
	'applet-path': 'fakeAppletPath',
	'entry-file-path': 'fakeEntryFilePath',
	'organization-uid': 'fakeOrganizationUid',
} as const;

export const singleFileOptions = {
	...defaultOptions,
	'applet-path': 'fakeAppletPath',
	'organization-uid': 'fakeOrganizationUid',
} as const;

export const noUserOptions = {
	...defaultOptions,
	'organization-uid': 'fakeOrganizationUid',
} as const;
