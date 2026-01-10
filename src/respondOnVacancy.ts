import type { Page } from 'playwright';
import { AUTO_HIDE_SUCCESSFUL_VACANCY, COVER_LETTER } from '../params.ts';
import { sleep } from './sleep.ts';
import { STATUSES, VacancyResponse } from './types.ts';

// страница открывается для фиксации "живой" активности
export async function respondOnVacancy(page: Page): Promise<VacancyResponse> {
	await page.waitForLoadState('domcontentloaded');
	const pageUrl = page.url();
	
	// скрываем вакансию если нужно, важно сделать это перед откликом
	if (!AUTO_HIDE_SUCCESSFUL_VACANCY) {
		const moreDataBtn = page.locator('[data-qa="vacancy__more-actions"]').first();
		await moreDataBtn.waitFor({
			state: 'visible',
			timeout: 3000
		}).then(() => {
			moreDataBtn.click();
			sleep();
		});
		
		await page.locator('[data-qa="vacancy__blacklist-menu-add-vacancy"]').first().click({ timeout: 3000 });
	}
	
	// подготовка данных о вакансии для опросников
	const [position, salary, experience, isRemote, testTask] = await Promise.all([
		page.locator('div.vacancy-title').first().textContent().catch(() => ''),
		page.locator('[data-qa="vacancy-salary"]').first().textContent().catch(() => ''),
		page.locator('[data-qa="work-experience-text"]').first().textContent().catch(() => ''),
		page.locator('[data-qa="work-formats-text"]').first().textContent().catch(() => ''),
		page.locator('div.vacancy-description').first().textContent().catch(() => '')
	]);
	const id = parseInt(pageUrl);
	const hasTestTask = testTask.includes('тестово');
	
	// откликаемся на вакансию
	const responseBtn = page.locator(
		'[data-qa="vacancy-response-link-top"], [data-qa="vacancy-response-link-bottom"], [data-qa="vacancy-view-link-reply"]'
	).first();
	
	if (!(await responseBtn.isVisible({ timeout: 3000 }))) {
		process.exit('Кнопка отклика не найдена, проверь селекторы сверху');
	}
	await responseBtn.click();
	await sleep();
	
	// скрываем попап другой страны
	const otherCountryBtn = page.locator('[data-qa="relocation-warning-confirm"]').first();
	await otherCountryBtn.click({ force: true, timeout: 500 }).catch(() => false);
	await sleep();
	
	// проверяем на редирект (значит, опросник), сохраняем такие вакансии в отдельный файл для ручного отклика
	const redirectedUrl = page.url();
	console.log(pageUrl, redirectedUrl);
	if (pageUrl !== redirectedUrl && !hasTestTask) {
		return {
			status: STATUSES.FAILURE,
			data: {
				id,
				position,
				salary: parseInt(salary),
				experience,
				isRemote: isRemote.includes('удалённо')
			}
		};
	}
	
	// заполняем и отправляем сопровод
	const coverLetterInput = page.locator('[data-qa="textarea-native-wrapper"] textarea').first();
	await coverLetterInput.waitFor({
		state: 'visible',
		timeout: 1500
	});
	await coverLetterInput.fill(COVER_LETTER);
	await sleep();
	
	const coverLetterBtn = page.locator('[data-qa="vacancy-response-letter-submit"], [data-qa="vacancy-response-submit-popup"]').first();
	await coverLetterBtn.waitFor({
		state: 'visible',
		timeout: 1500
	});
	await coverLetterBtn.click();
	await sleep();
	
	return {
		status: STATUSES.SUCCESS
	};
}

// export async function respondToVacancy(context: BrowserContext, url: string): Promise<VacancyResponse> {
// 	const page = await context.newPage();
// 	let response: VacancyResponse;
//
// 	try {
// 		await page.goto(url, {
// 			waitUntil: 'domcontentloaded',
// 			timeout: 5000
// 		});
// 		response = await respond(page);
// 	} catch (e) {
// 		console.log('Неизвестная ошибка - ', e);
// 	} finally {
// 		await page.close();
// 	}
// 	console.log('Завершена обработка вакансии - возвращаю статус - ' + response.status);
//
// 	return response;
// }