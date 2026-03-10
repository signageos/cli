import { IPaginatedList } from '@signageos/sdk';

/**
 * Fetches all pages from a paginated list.
 * @param firstPage The first page returned from a list() method
 * @returns Array containing all items from all pages
 */
export async function getAllPages<T>(firstPage: IPaginatedList<T>): Promise<T[]> {
	const allItems: T[] = [...firstPage];

	let currentPage: IPaginatedList<T> = firstPage;
	while (true) {
		const nextPage = await currentPage.getNextPage();
		if (!nextPage) {
			break;
		}
		allItems.push(...nextPage);
		currentPage = nextPage;
	}

	return allItems;
}
