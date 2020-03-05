
import * as http from 'http';
import * as url from 'url';
import * as ip from 'internal-ip';

// copied from webpack-dev-server/lib/utils/createDomain

interface IOptions {
	useLocalIp?: boolean;
	port?: number;
	https?: boolean;
	host?: string;
	socket?: boolean;
	public?: string;
}

export function createDomain(options: IOptions, server?: http.Server) {
	const protocol = options.https ? 'https' : 'http';
	const hostname = options.useLocalIp
		? ip.v4.sync() || 'localhost'
		: options.host || 'localhost';

	const serverAddress = server?.address();
	// eslint-disable-next-line no-nested-ternary
	const port = options.socket ? 0 : server ? (typeof serverAddress === 'object' ? serverAddress?.port || 0 : 0) : 0;
	// use explicitly defined public url
	// (prefix with protocol if not explicitly given)
	if (options.public) {
		return /^[a-zA-Z]+:\/\//.test(options.public)
			? `${options.public}`
			: `${protocol}://${options.public}`;
	}
	// the formatted domain (url without path) of the webpack server
	return url.format({
		protocol,
		hostname,
		port,
	});
}
