import type { Browser, Page } from 'playwright';

export const checkAuth = async (page: Page, browser: Browser) => {
	await page.goto('https://hh.ru/applicant/resumes', {
		waitUntil: 'domcontentloaded',
		timeout: 10000,
	});
	
	const login = page.locator('[data-qa="applicantProfilePage-button"]');
	const isLogged = await login.count()
	
	if (isLogged) {
		console.log('Вы успешно авторизованы!');
	} else {
		console.log('Ошибка авторизации на hh.ru! Запустите скрипт renew-cookie');
		await browser.close();
		process.exit(1);
	}
}
