import { chromium } from 'playwright';
import { buildSearchUrl } from '../src/buildSearchUrl.ts';
import { checkEnv } from '../src/checkEnv.ts';
import { getVacanciesList } from '../src/getVacanciesList.ts';
import { respondOnVacancy } from '../src/respondOnVacancy.ts';
import { STATUSES } from '../src/types.ts';

let globalSuccess = 0;
let globalFail = 0;
let isShuttingDown = false;

async function main() {
	checkEnv();
	
	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext({
		storageState: 'hh-state.json',
		viewport: { width: 1366, height: 768 }
	});
	const page = await context.newPage();
	
	process.on('SIGINT', async () => {
		isShuttingDown = true;
		console.log('\nОстановка скрипта...');
		await browser.close();
		process.exit(0);
	});
	
	// Проверка авторизации
	// await checkAuth(page, browser)
	
	const MAX_PAGES = 5;
	
	for (let pageIndex = 0; pageIndex < MAX_PAGES; pageIndex++) {
		const searchUrl = buildSearchUrl(pageIndex);
		
		await page.goto(searchUrl, {
			waitUntil: 'domcontentloaded',
			timeout: 60000
		});
		
		const vacancyUrls = await getVacanciesList(page);
		
		if (vacancyUrls.length === 0) {
			process.exit('Вакансий больше не осталось. Запустите скрипт позднее');
		}
		
		for (const vUrl of vacancyUrls) {
			// console.log('→ Отклик на вакансию:', vUrl);
			const page = await context.newPage();
			
			try {
				await page.goto(vUrl, {
					waitUntil: 'domcontentloaded',
					timeout: 5000
				});
				const response = await respondOnVacancy(page);
				
				if (response.status === STATUSES.SUCCESS) {
					globalSuccess++;
				} else {
					
					// здесь собирать
					
					globalFail++;
				}
				
			} catch (e) {
				console.log('Неизвестная ошибка - ', e);
			} finally {
				await page.close();
			}
		}
	}
	
	await browser.close();
}

main()
	.finally(() => {
		console.log('\n=== Финальный отчёт ===');
		console.log('Успешных откликов: ', globalSuccess);
		console.log('Опросники: ', globalFail);
	})
	.catch((e) => {
		if (!isShuttingDown) {
			console.error('Фатальная ошибка : ', e);
		}
	});