import { chromium } from 'playwright';
import { buildSearchUrl } from '../src/buildSearchUrl.ts';
import { checkAuth } from '../src/checkAuth.ts';
import { checkEnv } from '../src/checkEnv.ts';
import { closePopup } from '../src/closePopup.ts';
import { getVacanciesList } from '../src/getVacanciesList.ts';
import { respondToVacancy } from '../src/respondOnVacancy.ts';
import { STATUSES } from '../src/types.ts';

let globalSuccess = 0;
let globalFail = 0;
let globalExtra = 0;

async function main() {
	checkEnv();
	
	const browser = await chromium.launch({ headless: false });
	
	const context = await browser.newContext({
		storageState: 'hh-state.json', // тут лежат куки/сессия
		viewport: { width: 1366, height: 768 },
	});
	
	const page = await context.newPage();
	
	// Проверка авторизации
	await checkAuth(page, browser)
	console.log('ok');
	// return;
	
	const MAX_PAGES = 5;
	
	for (let pageIndex = 0; pageIndex < MAX_PAGES; pageIndex++) {
		const searchUrl = buildSearchUrl(pageIndex);
		// console.log(`\n=== Страница ${pageIndex}: ${searchUrl} ===\n`);
		
		await page.goto(searchUrl, {
			waitUntil: 'domcontentloaded',
			timeout: 60000,
		});
		await closePopup(page);
		
		const vacancyUrls = await getVacanciesList(page);
		console.log('Найдено вакансий на странице:', vacancyUrls.length);
		
		if (vacancyUrls.length === 0) {
			console.log('Вакансий больше нет, останавливаемся.');
			break;
		}
		
		let pageSuccess = 0;
		let pageFail = 0;
		let pageExtra = 0;
		
		const vUrl = vacancyUrls[0]
		
		// for (const vUrl of vacancyUrls) {
			console.log('→ Отклик на вакансию:', vUrl);
			const status = await respondToVacancy(context, vUrl);
			if (status === STATUSES.SUCCESS) pageSuccess++;
			else if (status === STATUSES.OTHER) pageExtra++;
			else pageFail++;
			
			console.log(`   Статус: ${status}`);
		// }
		
		globalSuccess += pageSuccess;
		globalFail += pageFail;
		globalExtra += pageExtra;
		
		console.log(`\nИтого по странице ${pageIndex + 1}:`);
		console.log('  Успешных откликов:', pageSuccess);
		console.log('  С опросником:', pageExtra);
		console.log('  Ошибок:', pageFail);
	}
	
	await browser.close();
}

main()
	.finally(() => {
		console.log('\n=== Финальный отчёт ===');
		console.log('Успешных откликов:', globalSuccess);
		console.log('Откликов с доп. шагами (опросник):', globalExtra);
		console.log('Неуспешных (ошибки):', globalFail);
	})
	.catch((e) => {
	console.error('Фатальная ошибка скрипта:', e);
});
