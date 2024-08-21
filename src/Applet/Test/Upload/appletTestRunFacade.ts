import IAppletTestSuite from '@signageos/sdk/dist/RestApi/Applet/Version/IAppletTestSuite';

export function validateTestIdentifiers(identifiers: string[], suites: IAppletTestSuite[]) {
	const existingIdentifiers = suites.map((suite) => suite.identifier);
	for (const identifier of identifiers) {
		if (!existingIdentifiers.includes(identifier)) {
			throw new Error(`Test ${identifier} is not in currently uploaded test suites.`);
		}
	}
}
