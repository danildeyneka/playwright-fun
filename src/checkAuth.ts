import type { Browser, Page } from 'playwright';
import { getSiteLink } from '../scripts/shared/getSiteLink.ts';

export const checkAuth = async (page: Page, browser: Browser, isZarplataRu?: boolean) => {
	await page.goto(`${getSiteLink(isZarplataRu)}/profile/me`, {
		waitUntil: 'domcontentloaded',
		timeout: 3000,
	})
	await page.locator('[data-qa="profileAndResumes-button"]').waitFor({state: 'visible', timeout: 3000})
		.catch(async () => {
		console.log('Ошибка авторизации! Запустите скрипт renew-cookie');
		await browser.close();
		process.exit(1);
	});
	
	console.log('Вы успешно авторизованы!');
}
