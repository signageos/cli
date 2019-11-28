import * as fs from 'fs-extra';
import { computeMD5 } from '../Stream/helper';

export async function computeFileMD5(path: string) {
	const fileStream = fs.createReadStream(path);

	return await computeMD5(fileStream);
}
