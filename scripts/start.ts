import * as fs from 'fs/promises';
import * as path from 'node:path';
import { chromium } from 'playwright';
import { AUTO_HIDE_VACANCY, VACANCIES_LIST } from '../params.ts';
import { checkAuth } from '../src/checkAuth.ts';
import { checkEnv } from '../src/checkEnv.ts';
import { getTimeStamp } from '../src/getTimeStamp.ts';
import { getVacanciesList } from '../src/getVacanciesList.ts';
import { respondOnVacancy } from '../src/respondOnVacancy.ts';
import { LIMIT_EXCEEDED, STATUSES } from '../src/types.ts';

let globalSuccess = 0;
let globalFail = 0;
const manualVacancies = [];

async function main() {
	checkEnv();
	
	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({
		storageState: 'hh-state.json',
		viewport: { width: 1366, height: 768 }
	});
	const page = await context.newPage();
	
	// Проверка авторизации
	await checkAuth(page, browser);
	
	// максимально откликнуться можно 200 раз, парсим страницы с учетом вакансий-опросников
	for (let i = 1; i < 4; i++) {
		const searchUrl = `${VACANCIES_LIST}&items_on_page=100${!AUTO_HIDE_VACANCY ? ('&page=' + i) : ''}`;
		
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
				
				if (response.status === STATUSES.FAILURE && response.data) {
						manualVacancies.push(response.data);
						globalFail++;
				} else {
					globalSuccess++;
					console.log('Успешных откликов - ', globalSuccess);
				}
				
			} catch (e) {
				if (e.message === LIMIT_EXCEEDED) {
					console.log(LIMIT_EXCEEDED);
					await exit();
					process.exit(0);
				}
				console.log('Неизвестная ошибка - ', e?.message);
			} finally {
				await page.close();
			}
		}
		
		await page.reload();
	}

	await browser.close();
}

main()
	.catch(async (e) => {
		console.error('Фатальная ошибка : ', e);
	}).finally(async () => {
		await exit();
});

async function exit() {
	console.log('\n=== Финальный отчёт ===');
	console.log('Успешных откликов: ', globalSuccess);
	console.log('Опросники: ', globalFail, '\n');
	if (manualVacancies.length) {
		const date = getTimeStamp();
		await fs.mkdir(path.join(process.cwd(), 'manual'), { recursive: true });
		const outputPath = path.join(process.cwd(), 'manual', `list-${date}.json`);
		await fs.writeFile(outputPath, JSON.stringify(manualVacancies, null, 2), 'utf-8');
	}
}