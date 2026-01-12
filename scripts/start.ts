import * as fs from 'fs/promises';
import * as path from 'node:path';
import { chromium } from 'playwright';
import { VACANCIES_LIST } from '../params';
import { checkAuth } from '../src/checkAuth.ts';
import { checkEnv } from '../src/checkEnv.ts';
import { getTimeStamp } from '../src/getTimeStamp.ts';
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
	await checkAuth(page, browser)
	
	const manualVacancies = [];
	
	// максимально откликнуться можно 200 раз, парсим страницы с учетом вакансий-опросников
	for (let i = 0; i < 3; i++) {
		const searchUrl = `${VACANCIES_LIST}&items_on_page=100`;
		
		await page.goto(searchUrl, {
			waitUntil: 'domcontentloaded',
			timeout: 60000
		});
		
		const vacancyUrls = await getVacanciesList(page);
		
		if (vacancyUrls.length === 0) {
			process.exit('Вакансий больше не осталось. Запустите скрипт позднее');
		}
		
		for (const vUrl of vacancyUrls) {
			const page = await context.newPage();
			
			try {
				await page.goto(vUrl, {
					waitUntil: 'domcontentloaded',
					timeout: 5000
				});
				const response = await respondOnVacancy(page);
				
				if (response.status === STATUSES.FAILURE) {
					manualVacancies.push(response.data);
					
					globalFail++;
				} else {
					globalSuccess++;
				}
				
			} catch (e) {
				if (!isShuttingDown) console.log('Неизвестная ошибка - ', e);
			} finally {
				await page.close();
			}
		}
		
		await page.reload();
	}
	
	if (manualVacancies.length) {
		const date = getTimeStamp();
		await fs.mkdir(path.join(process.cwd(), 'manual'), { recursive: true });
		const outputPath = path.join(process.cwd(), 'manual', `list-${date}.json`);
		await fs.writeFile(outputPath, JSON.stringify(manualVacancies, null, 2), 'utf-8');
	}
	await browser.close();
}

main()
	.catch((e) => {
		if (!isShuttingDown) {
			console.error('Фатальная ошибка : ', e);
		}
	}).finally(() => {
	console.log('\n=== Финальный отчёт ===');
	console.log('Успешных откликов: ', globalSuccess);
	console.log('Опросники: ', globalFail, '\n');
});