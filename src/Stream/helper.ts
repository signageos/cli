import * as crypto from 'crypto';
export async function computeMD5(input: NodeJS.ReadableStream): Promise<string> {
	return new Promise((resolve: (value: string) => void, reject: () => void) => {
		const hash = crypto.createHash('md5');
		input.on('readable', () => {
			const data = input.read();
			if (data) {
				hash.update(data);
			} else {
				resolve(hash.digest('base64'));
			}
		});
		input.on('error', reject);
	});
}
