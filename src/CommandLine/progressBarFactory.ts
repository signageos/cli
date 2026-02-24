import * as cliProgress from 'cli-progress';

export function createProgressBar() {
	// Create a MultiBar instance to manage multiple progress bars
	const multiBar = new cliProgress.MultiBar(
		{
			format: '[{bar}] {name} {percentage}% | ETA: {eta}s | {valueKB}/{totalKB} kB',
			forceRedraw: true, // Force redraw to ensure the display updates correctly
			linewrap: false, // Disable line wrapping to keep the output clean
			autopadding: true, // Automatically adjust padding for better alignment
			etaBuffer: 5, // Reduced buffer for faster ETA calculation on small files
			etaAsynchronousUpdate: false, // Disable asynchronous ETA updates to avoid NULL/Infinite states
		},
		cliProgress.Presets.rect,
	);

	// Keep track of all bars to clean up properly
	const bars = new Map<string, cliProgress.SingleBar>();
	const barValues = new Map<string, { current: number; total: number }>();

	return {
		init({ size, name }: { size: number; name: string }) {
			// If a bar already exists with this name, stop and remove it
			if (bars.has(name)) {
				const existingBar = bars.get(name);
				if (existingBar) {
					existingBar.stop();
					bars.delete(name);
					barValues.delete(name);
				}
			}

			// Create a new bar for this file
			const totalKB = Math.round((size / 1024) * 100) / 100; // Round to 2 decimal places
			const bar = multiBar.create(size, 0, {
				name,
				totalKB: totalKB,
				valueKB: 0,
			});
			bars.set(name, bar);
			barValues.set(name, { current: 0, total: size });
		},

		update({ add, name }: { add: number; name?: string }) {
			if (name && bars.has(name)) {
				const bar = bars.get(name);
				const values = barValues.get(name);
				if (bar && values) {
					// Update tracked values
					values.current += add;

					// Calculate kB values
					const valueKB = Math.round((values.current / 1024) * 100) / 100;
					const totalKB = Math.round((values.total / 1024) * 100) / 100;

					// Update bar with new values
					bar.update(values.current, {
						name,
						totalKB: totalKB,
						valueKB: valueKB,
					});

					// Force ETA update
					bar.updateETA();
				}
			}
		},

		end() {
			multiBar.stop();
			bars.clear();
			barValues.clear();
		},
	};
}
