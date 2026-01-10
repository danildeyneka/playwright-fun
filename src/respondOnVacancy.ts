import type { BrowserContext, Page } from 'playwright';
import { AUTO_HIDE_SUCCESSFUL_VACANCY, COVER_LETTER } from '../params.ts';
import { sleep, sleepAbit } from './sleep.ts';
import { ResponseStatus, STATUSES } from './types.ts';

// страница открывается для фиксации "живой" активности
async function respond(page: Page): Promise<ResponseStatus> {
	await page.waitForLoadState('domcontentloaded');
	
	// скрываем вакансию если нужно, важно сделать это перед откликом
	if (!AUTO_HIDE_SUCCESSFUL_VACANCY) {
		const moreDataBtn = page.locator('[data-qa="vacancy__more-actions"]').first();
		await moreDataBtn.waitFor({
			state: 'visible',
			timeout: 3000
		}).then(() => {
			moreDataBtn.click();
			sleepAbit();
		});
		
		await page.locator('[data-qa="vacancy__blacklist-menu-add-vacancy"]').first().click({ timeout: 3000 });
		console.log('Успешное скрытие вакансии');
	}
	
	// откликаемся на вакансию
	const responseBtn = page.locator(
		'[data-qa="vacancy-response-link-top"], [data-qa="vacancy-response-link-bottom"], [data-qa="vacancy-view-link-reply"]'
	).first();
	
	if (!(await responseBtn.isVisible({ timeout: 3000 }))) {
		console.log('Кнопка отклика не найдена, проверь селекторы');
		return STATUSES.FAILURE;
	}
	await responseBtn.click();
	await sleepAbit();
	
	// скрываем попап другой страны
	const otherCountryBtn = page.locator('[data-qa="relocation-warning-confirm"]').first();
	console.log(1);
	await otherCountryBtn.click().catch(() => false);
	console.log(2);
	await sleepAbit();
	
	// заполняем и отправляем сопровод
	const coverLetterInput = page.locator('[data-qa="textarea-native-wrapper"] textarea').first();
	console.log(3);
	await coverLetterInput.waitFor({ state: 'visible', timeout: 1500 });
	
	await coverLetterInput.fill(COVER_LETTER);
	await sleepAbit();
	
	const coverLetterBtn = page.locator('[data-qa="vacancy-response-letter-submit"], [data-qa="vacancy-response-submit-popup"]').first();
	await coverLetterBtn.waitFor({ state: 'visible', timeout: 1500 });
	await coverLetterBtn.click();
	await sleepAbit();
	
	const isSuccessful = page.locator('div.vacancy-actions_responded').first();
	if (!await isSuccessful.isVisible({timeout: 3000})) {
		throw Error('Опросник')
	}
	
	return STATUSES.SUCCESS;
}

export async function respondToVacancy(context: BrowserContext, url: string): Promise<ResponseStatus> {
	const page = await context.newPage();
	let status: ResponseStatus = STATUSES.FAILURE;
	
	try {
		await page.goto(url, {
			waitUntil: 'domcontentloaded',
			timeout: 6000
		});
		status = await respond(page);
	} catch (e) {
		console.log('Ошибка при отклике на вакансию, это опросник!', e);
		status = STATUSES.FAILURE;
	} finally {
		if (status === STATUSES.SUCCESS) { // TODO сделать для всех
			await page.close();
		}
	}
	console.log('Завершена обработка вакансии - возвращаю статус - ' + status);
	
	return status;
}