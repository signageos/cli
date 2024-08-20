export default function wait(timeout: number) {
	return new Promise<void>((resolve: () => void) => setTimeout(() => resolve(), timeout));
}
