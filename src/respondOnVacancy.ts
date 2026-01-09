import type { BrowserContext, Page } from 'playwright';
import { AUTO_HIDE_SUCCESSFUL_VACANCY, COVER_LETTER } from '../params.ts';
import { sleep, sleepAbit } from './sleep.ts';
import { ResponseStatus, STATUSES } from './types.ts';

async function respond(page: Page): Promise<ResponseStatus> {
	await page.waitForLoadState('domcontentloaded');
	
	// скрываем вакансию если нужно, важно сделать это перед откликом
	if (AUTO_HIDE_SUCCESSFUL_VACANCY) {
		const moreDataBtn = page.locator('[data-qa="vacancy__more-actions"]').first();
		await moreDataBtn.waitFor({
			state: 'visible',
			timeout: 2000
		}).then(() => {
			moreDataBtn.click();
			sleepAbit();
		});
		
		await page.locator('[data-qa="vacancy__blacklist-menu-add-vacancy"]').first().click({timeout: 3000});
	}
	
	await sleep();
	
	// откликаемся на вакансию
	const responseBtn = page.locator(
		'[data-qa="vacancy-response-link-top"], [data-qa="vacancy-response-link-bottom"], [data-qa="vacancy-view-link-reply"]'
	).first();
	
	if (!(await responseBtn.isVisible())) {
		console.log('Кнопка отклика не найдена, проверь селекторы');
		return STATUSES.FAILURE;
	}
	await responseBtn.click();
	
	// скрываем попап другой страны
	const otherCountryBtn = page.locator('[data-qa="relocation-warning-confirm"]').first();
	if (await otherCountryBtn.count())
	await otherCountryBtn.waitFor({ state: 'visible', timeout: 2000 }).then(() => {
		otherCountryBtn.click();
		sleepAbit();
	});
	
	// await closePopup(page);
	
	// заполняем и отправляем сопровод
	const coverLetterInput = page.locator('[data-qa="textarea-native-wrapper"] textarea').first();
	await coverLetterInput.waitFor({ state: 'visible', timeout: 2000 }).then(() => {
		coverLetterInput.fill(COVER_LETTER);
		sleepAbit();
	});
	
	const coverLetterBtn = page.locator('[data-qa="vacancy-response-letter-submit"], [data-qa="vacancy-response-submit-popup"]').first();
	await coverLetterBtn.waitFor({ state: 'visible', timeout: 2000 }).then(() => {
		coverLetterBtn.click();
		sleep();
	}).catch((e) => console.log('Кнопка не найдена, это опросник!', e));
	
	// const extraStep = page.locator(
	// 	'[data-qa="questionary-form"], [data-qa="vacancy-response-extra-step"], [data-qa="vacancy-quick-response-questions"]'
	// );
	// if (await extraStep.isVisible().catch(() => false)) {
	// 	return STATUSES.OTHER;
	// }
	//
	// Если ни успеха, ни анкеты — считаем ошибкой
	console.log('========== УСПЕШНЫЙ ОТКЛИК');
	return STATUSES.SUCCESS;
}

export async function respondToVacancy(context: BrowserContext, url: string): Promise<ResponseStatus> {
	const page = await context.newPage();
	let status: ResponseStatus = STATUSES.FAILURE;
	
	try {
		await page.goto(url, {
			waitUntil: 'domcontentloaded',
			timeout: 60000
		});
		status = await respond(page);
	} catch (e) {
		console.error('Ошибка при отклике на вакансию', url, e);
	} finally {
		if (status === STATUSES.SUCCESS) { // TODO сделать для всех
			await page.close().catch(() => {
			});
		}
	}
	
	return status;
}