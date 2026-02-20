import { IPaginatedList } from '@signageos/sdk';

/**
 * Fetches all pages from a paginated list
 * @param firstPage The first page returned from a list() method
 * @returns Array containing all items from all pages
 */
export async function getAllPages<T>(firstPage: IPaginatedList<T>): Promise<T[]> {
	const allItems: T[] = [];

	// Collect items from first page
	allItems.push(...firstPage);

	// Fetch remaining pages
	let currentPage = firstPage;
	while (true) {
		const nextPage = await currentPage.getNextPage();
		if (!nextPage) {
			break; // No more pages
		}
		allItems.push(...nextPage);
		currentPage = nextPage;
	}

	return allItems;
}
