import * as cliProgress from 'cli-progress';

export function createProgressBar() {
	const progressBar = new cliProgress.Bar({}, cliProgress.Presets.rect);

	return {
		init({ size, name }: { size: number, name: string }) {
			progressBar.start(size, 0, { filename: name });
		},

		update({ add }: { add: number }) {
			progressBar.increment(add);
		},

		end() {
			progressBar.stop();
		},
	};
}
