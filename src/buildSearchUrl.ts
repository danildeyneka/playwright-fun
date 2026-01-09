import { VACANCIES_LIST } from '../params.ts';

export function buildSearchUrl(pageIndex: number): string {
	return `${VACANCIES_LIST}&items_on_page=10&page=${pageIndex}`;
}