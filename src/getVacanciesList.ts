import type { Page } from 'playwright';
import { getSiteLink } from '../scripts/shared/getSiteLink.ts';

export async function getVacanciesList(page: Page, isZarplataRu?: boolean): Promise<string[]> {
	const items = page.locator(
		'[data-qa="vacancy-serp__vacancy"] a[data-qa="serp-item__title"]'
	);
	const count = await items.count();
	const urls: string[] = [];
	
	for (let i = 0; i < count; i++) {
		const href = await items.nth(i).getAttribute('href');
		if (!href) continue;
		
		// hh иногда даёт относительные ссылки
		if (href.startsWith('http')) {
			urls.push(href);
		} else {
			urls.push(getSiteLink(isZarplataRu) + href);
		}
	}
	
	return urls;
}