import type { Page } from 'playwright';
import { VACANCY_TITLE_FILTER } from '../params.ts';
import { getSiteLink } from '../scripts/shared/getSiteLink.ts';

export async function getVacanciesList(page: Page, isZarplataRu?: boolean): Promise<string[]> {
	const items = page.locator('[data-qa="vacancy-serp__results"] [data-qa="vacancy-serp__vacancy"] a[data-qa="serp-item__title"]');
	const count = await items.count();
	const urls: string[] = [];
	const vacancyFilterTitle = VACANCY_TITLE_FILTER.split(',') || [];
	
	for (let i = 0; i < count; i++) {
		if (vacancyFilterTitle.length) {
			const vacancyTitle = await items.nth(i).textContent().then(text => text.toLowerCase());
			let isAccurate = false;
			vacancyFilterTitle.forEach(title => {
				if (vacancyTitle.includes(title.toLowerCase())) {
					isAccurate = true;
					return;
				}
			});
			if (!isAccurate) {
				continue;
			}
		}
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