import type { Page } from 'playwright';
import { AUTO_HIDE_VACANCY, COVER_LETTER } from '../params.ts';
import { sleep } from './sleep.ts';
import { STATUSES, VacancyResponse } from './types.ts';

// страница открывается для фиксации "живой" активности
export async function respondOnVacancy(page: Page): Promise<VacancyResponse> {
	await page.waitForLoadState('domcontentloaded');
	
	// подготовка данных о вакансии для опросников
	const positionPromise = page.locator('h1.bloko-header-section-1').first().textContent().catch(() => '');
	const salaryPromise = page.locator('div.vacancy-title span').first().textContent().catch(() => '');
	const experiencePromise = page.locator('[data-qa="work-experience-text"]').first().textContent().catch(() => '');
	const isRemotePromise = page.locator('[data-qa="work-formats-text"]').first().textContent().catch(() => '');
	const testTaskPromise = page.locator('div.vacancy-description').first().textContent().catch(() => '');
	const pageUrl = page.url();
	
	// скрываем вакансию если нужно, важно сделать это перед откликом
	if (AUTO_HIDE_VACANCY) {
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
	
	// проверяем на редирект (значит, опросник) и наличие тестового задания, сохраняем такие вакансии в отдельный файл для ручного отклика
	const redirectedUrl = page.url();
	const hasTestTask = await testTaskPromise.then(res => res.includes('тестово'));
	
	if (pageUrl !== redirectedUrl && !hasTestTask) {
		const [position, salary, experience, isRemote] = await Promise.all([
			positionPromise,
			salaryPromise,
			experiencePromise,
			isRemotePromise
		]);
		
		return {
			status: STATUSES.FAILURE,
			data: {
				link: pageUrl,
				questionnaire: redirectedUrl,
				position,
				salary: salary,
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
