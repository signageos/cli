import * as os from 'os';
import * as fs from 'fs-extra';
import * as path from 'path';

const SOS_CACHE_DIR = 'sos-cache';

const TMP_BASE_PATH = path.join(os.tmpdir(), SOS_CACHE_DIR);

interface ICachedValue {
	value: string;
	expireAt: number;
}

export function getCachedValue(key: string): string | null {
	try {
		fs.ensureDirSync(TMP_BASE_PATH);
		const cacheValuePath = path.join(TMP_BASE_PATH, key);
		const cachedValue: ICachedValue = JSON.parse(fs.readFileSync(cacheValuePath).toString());
		if (hasExpired(cachedValue.expireAt)) {
			return null;
		}
		return cachedValue.value;
	} catch {
		return null;
	}
}

export interface IOptions {
	expireInMs: number;
}

export function updateCacheValue(key: string, value: string, options: IOptions): void {
	try {
		fs.ensureDirSync(TMP_BASE_PATH);
		const cacheValuePath = path.join(TMP_BASE_PATH, key);
		const cachedValue: ICachedValue = {
			value,
			expireAt: new Date().valueOf() + options.expireInMs,
		};
		fs.writeFileSync(cacheValuePath, JSON.stringify(cachedValue));
	} catch {
		// skip caching
	}
}

function hasExpired(expireAt: number) {
	return new Date().valueOf() > expireAt;
}
