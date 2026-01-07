import { chromium } from 'playwright';

const init = async () => {
	console.log('Началась запись сессии');
	
	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext();
	const page = await context.newPage();
	
	await page.goto('https://hh.ru', {
		waitUntil: 'domcontentloaded',
		timeout: 60000,
	});
	
	console.log('Открылся hh.ru. Залогинься, потом нажми Enter в консоли.');
	
	process.stdin.once('data', async () => {
		await context.storageState({ path: 'hh-state.json' });
		console.log('✅ Состояние сохранено в hh-state.json');
		await browser.close();
		process.exit(0);
	});
};

init();