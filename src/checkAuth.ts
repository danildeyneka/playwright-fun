import type { Browser, Page } from 'playwright';

export const checkAuth = async (page: Page, browser: Browser) => {
	await page.goto('https://hh.ru/profile/me', {
		waitUntil: 'domcontentloaded',
		timeout: 3000,
	})
	
	await page.locator('[data-qa="profileAndResumes-button"]').waitFor({state: 'visible', timeout: 3000}).catch(async () => {
		console.log('Ошибка авторизации на hh.ru! Запустите скрипт renew-cookie');
		await browser.close();
		process.exit(1);
	});
	
	console.log('Вы успешно авторизованы!');
}
