import should from 'should';
import { getAllPages } from '../../../src/helper/paginationHelper';
import { IPaginatedList } from '@signageos/sdk';

describe('paginationHelper', () => {
	describe('getAllPages', () => {
		it('should return all items from a single page when no next page exists', async () => {
			// Arrange
			const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
			const mockPage: IPaginatedList<{ id: number }> = Object.assign(items, {
				getNextPage: async () => null,
			});

			// Act
			const result = await getAllPages(mockPage);

			// Assert
			should(result).have.length(3);
			should(result[0]).have.property('id', 1);
			should(result[1]).have.property('id', 2);
			should(result[2]).have.property('id', 3);
		});

		it('should fetch and combine all pages when multiple pages exist', async () => {
			// Arrange - Create page 3 (last page)
			const page3Items = [{ id: 7 }, { id: 8 }, { id: 9 }];
			const mockPage3: IPaginatedList<{ id: number }> = Object.assign(page3Items, {
				getNextPage: async () => null,
			});

			// Create page 2
			const page2Items = [{ id: 4 }, { id: 5 }, { id: 6 }];
			const mockPage2: IPaginatedList<{ id: number }> = Object.assign(page2Items, {
				getNextPage: async () => mockPage3,
			});

			// Create page 1
			const page1Items = [{ id: 1 }, { id: 2 }, { id: 3 }];
			const mockPage1: IPaginatedList<{ id: number }> = Object.assign(page1Items, {
				getNextPage: async () => mockPage2,
			});

			// Act
			const result = await getAllPages(mockPage1);

			// Assert
			should(result).have.length(9);
			should(result[0]).have.property('id', 1);
			should(result[3]).have.property('id', 4);
			should(result[6]).have.property('id', 7);
			should(result[8]).have.property('id', 9);
		});

		it('should handle empty first page', async () => {
			// Arrange
			const mockPage: IPaginatedList<{ id: number }> = Object.assign([], {
				getNextPage: async () => null,
			});

			// Act
			const result = await getAllPages(mockPage);

			// Assert
			should(result).have.length(0);
		});

		it('should handle more than 100 items across pages (simulating real pagination)', async () => {
			// Arrange - Simulate pagination with 100 items per page, 4 pages total
			const page4Items = Array.from({ length: 100 }, (_, i) => ({ id: 301 + i }));
			const mockPage4: IPaginatedList<{ id: number }> = Object.assign(page4Items, {
				getNextPage: async () => null,
			});

			const page3Items = Array.from({ length: 100 }, (_, i) => ({ id: 201 + i }));
			const mockPage3: IPaginatedList<{ id: number }> = Object.assign(page3Items, {
				getNextPage: async () => mockPage4,
			});

			const page2Items = Array.from({ length: 100 }, (_, i) => ({ id: 101 + i }));
			const mockPage2: IPaginatedList<{ id: number }> = Object.assign(page2Items, {
				getNextPage: async () => mockPage3,
			});

			const page1Items = Array.from({ length: 100 }, (_, i) => ({ id: 1 + i }));
			const mockPage1: IPaginatedList<{ id: number }> = Object.assign(page1Items, {
				getNextPage: async () => mockPage2,
			});

			// Act
			const result = await getAllPages(mockPage1);

			// Assert
			should(result).have.length(400); // 4 pages * 100 items
			should(result[0]).have.property('id', 1);
			should(result[99]).have.property('id', 100);
			should(result[100]).have.property('id', 101);
			should(result[200]).have.property('id', 201);
			should(result[300]).have.property('id', 301);
			should(result[399]).have.property('id', 400);
		});
	});
});
