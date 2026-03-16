import { PaginatedList } from '@signageos/sdk';

export function createPage<T>(devices: T[], next: PaginatedList<T> | null = null): PaginatedList<T> {
	return new PaginatedList(devices, async () => next);
}
