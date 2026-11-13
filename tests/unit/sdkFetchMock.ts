import sinon from 'sinon';

interface ISdkRequestInit {
	method: string;
	headers: Record<string, string>;
	body?: string;
}

// The node-fetch instance the SDK sends its requests with
const sdkNodeFetch: {
	default: (url: string, init: ISdkRequestInit) => Promise<unknown>;
	Response: typeof Response;
} = require(require.resolve('node-fetch', { paths: [require.resolve('@signageos/sdk')] }));

interface ISdkResponse {
	status?: number;
	body?: unknown;
	headers?: Record<string, string>;
}

/** Stubs every HTTP request the SDK makes; `respond` decides the response from the request URL and method */
export function stubSdkFetch(respond: (url: URL, method: string) => ISdkResponse = () => ({})) {
	return sinon.stub(sdkNodeFetch, 'default').callsFake(async (url, init) => {
		const { status = 200, body = {}, headers } = respond(new URL(url), init.method);
		return new sdkNodeFetch.Response(JSON.stringify(body), { status, headers });
	});
}
