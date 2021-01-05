import * as cliProgress from 'cli-progress';

export function createProgressBar() {
	const progressBar = new cliProgress.Bar(
		{
			format: '[{bar}] {name} {percentage}% | ETA: {eta}s | {value}/{total}',
		},
		cliProgress.Presets.rect,
	);

	let current = 0;
	let currentName: string = 'preparing';

	return {
		init({ size, name }: { size: number, name: string }) {
			currentName = name;
			progressBar.start(size, current, { name });
		},

		update({ add, name }: { add: number, name?: string }) {
			current += add;
			currentName = name || currentName;
			progressBar.update(current + add, { name: currentName });
		},

		end() {
			progressBar.stop();
		},
	};
}
