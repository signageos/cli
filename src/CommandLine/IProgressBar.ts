export interface ProgressBar {
	init: (params: { size: number, name: string }) => void;
	update: (params: { add: number }) => void;
	end: () => void;
}
