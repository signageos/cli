export interface ProgressBar {
	init: (params: { size: number; name: string }) => void;
	update: (params: { add: number; name?: string }) => void;
	end: () => void;
}
