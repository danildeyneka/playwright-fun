import { chromium } from 'playwright';
import { getSiteLink } from './getSiteLink.ts';

export const saveSession = async (isZarplataRu?: boolean) => {
	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext();
	const page = await context.newPage();
	
	await page.goto(getSiteLink(isZarplataRu), {
		waitUntil: 'domcontentloaded',
		timeout: 60000
	});
	
	console.log('Открылся сайт. Залогинься, потом нажми Enter в консоли.');
	
	process.stdin.once('data', async () => {
		await context.storageState({ path: (isZarplataRu ? 'zp' : 'hh') + '-state.json' });
		console.log('Состояние успешно сохранено');
		await browser.close();
		process.exit(0);
	});
};