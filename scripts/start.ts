import { type BrowserContext, chromium, type Page } from 'playwright';
import { COVER_LETTER, VACANCIES_LIST } from '../params.ts';
import { checkAuth } from '../src/checkAuth.ts';
import { checkEnv } from '../src/checkEnv.ts';

// ----------------- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ -----------------

async function tryCloseChatAndPopups(page: Page) {
	const selectors = [
		'[data-qa="chat-widget-close"]',
		'[data-qa="vacancychat-header-action"]',
		'.bloko-modal-close',
		'[data-qa="dismiss-notice"]',
	];
	
	for (const sel of selectors) {
		const el = page.locator(sel).first();
		if (await el.isVisible().catch(() => false)) {
			await el.click().catch(() => {});
		}
	}
}

async function getVacancyUrls(page: Page): Promise<string[]> {
	const items = page.locator(
		'[data-qa="vacancy-serp__vacancy"] a[data-qa="serp-item__title"]'
	);
	const count = await items.count();
	const urls: string[] = [];
	
	for (let i = 0; i < count; i++) {
		const href = await items.nth(i).getAttribute('href');
		if (!href) continue;
		
		// hh иногда даёт относительные ссылки
		if (href.startsWith('http')) {
			urls.push(href);
		} else {
			urls.push('https://chelyabinsk.hh.ru' + href);
		}
	}
	
	return urls;
}

type ResponseStatus = 'success' | 'extra_steps' | 'failure';

async function respondOnVacancyPage(page: Page): Promise<ResponseStatus> {
	await page.waitForLoadState('domcontentloaded');
	await tryCloseChatAndPopups(page);
	
	// Кнопки отклика (верх/низ страницы)[web:4]
	const responseButton = page.locator(
		'[data-qa="vacancy-response-link-top"], [data-qa="vacancy-response-link-bottom"], [data-qa="vacancy-view-link-reply"]'
	).first();
	
	if (!(await responseButton.isVisible().catch(() => false))) {
		return 'failure';
	}
	
	await responseButton.click().catch(() => {});
	
	await tryCloseChatAndPopups(page);
	
	// Поле сопроводительного письма[web:4]
	const coverLetterField = page.locator(
		'textarea[name*="letter"], [data-qa="vacancy-response-letter-input"]'
	);
	if (await coverLetterField.isVisible().catch(() => false)) {
		await coverLetterField.fill(COVER_LETTER);
	}
	
	// Кнопка отправки отклика
	const sendButton = page.locator(
		'[data-qa="vacancy-response-submit-button"], [data-qa="vacancy-response-submit"]'
	);
	if (await sendButton.isVisible().catch(() => false)) {
		await sendButton.click().catch(() => {});
	}
	
	// Успешный отклик (баннер/статус)[web:4]
	const successBanner = page.locator(
		'[data-qa="vacancy-response-success-message"], [data-qa="vacancy-response-status"]'
	);
	if (await successBanner.isVisible({ timeout: 8000 }).catch(() => false)) {
		return 'success';
	}
	
	// Опросник/доп. шаги (анкеты, тесты)[web:4]
	const extraStep = page.locator(
		'[data-qa="questionary-form"], [data-qa="vacancy-response-extra-step"], [data-qa="vacancy-quick-response-questions"]'
	);
	if (await extraStep.isVisible().catch(() => false)) {
		return 'extra_steps';
	}
	
	// Если ни успеха, ни анкеты — считаем ошибкой
	return 'failure';
}

async function respondToVacancy(context: BrowserContext, url: string): Promise<ResponseStatus> {
	const page = await context.newPage();
	let status: ResponseStatus = 'failure';
	
	try {
		await page.goto(url, {
			waitUntil: 'domcontentloaded',
			timeout: 60000,
		});
		status = await respondOnVacancyPage(page);
	} catch (e) {
		console.error('Ошибка при отклике на вакансию', url, e);
		status = 'failure';
	} finally {
		// По ТЗ: если неуспешно (опросник) — вкладку НЕ закрывать.
		// Опросник — это extra_steps.
		if (status === 'success') {
			await page.close().catch(() => {});
		}
		// extra_steps и failure остаются открытыми (можно позже посмотреть вручную).
	}
	
	return status;
}

function buildSearchUrl(pageIndex: number): string {
	// pageIndex: 0,1,2,...
	return `${VACANCIES_LIST}&items_on_page=100&page=${pageIndex}`;
}

// ----------------- ОСНОВНОЙ СКРИПТ -----------------

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
	return;
	
	let globalSuccess = 0;
	let globalFail = 0;
	let globalExtra = 0;
	
	// Сколько страниц обойти (можно настроить)
	const MAX_PAGES = 5;
	
	for (let pageIndex = 0; pageIndex < MAX_PAGES; pageIndex++) {
		const searchUrl = buildSearchUrl(pageIndex);
		console.log(`\n=== Страница ${pageIndex + 1}: ${searchUrl} ===\n`);
		
		await page.goto(searchUrl, {
			waitUntil: 'domcontentloaded',
			timeout: 60000,
		});
		await tryCloseChatAndPopups(page);
		
		const vacancyUrls = await getVacancyUrls(page);
		console.log('Найдено вакансий на странице:', vacancyUrls.length);
		
		if (vacancyUrls.length === 0) {
			console.log('Вакансий больше нет, останавливаемся.');
			break;
		}
		
		let pageSuccess = 0;
		let pageFail = 0;
		let pageExtra = 0;
		
		for (const vUrl of vacancyUrls) {
			console.log('→ Отклик на вакансию:', vUrl);
			const status = await respondToVacancy(context, vUrl);
			if (status === 'success') pageSuccess++;
			else if (status === 'extra_steps') pageExtra++;
			else pageFail++;
			
			console.log(`   Статус: ${status}`);
		}
		
		globalSuccess += pageSuccess;
		globalFail += pageFail;
		globalExtra += pageExtra;
		
		console.log(`\nИтого по странице ${pageIndex + 1}:`);
		console.log('  Успешных откликов:', pageSuccess);
		console.log('  С опросником:', pageExtra);
		console.log('  Ошибок:', pageFail);
	}
	
	console.log('\n=== Финальный отчёт ===');
	console.log('Успешных откликов:', globalSuccess);
	console.log('Откликов с доп. шагами (опросник):', globalExtra);
	console.log('Неуспешных (ошибки):', globalFail);
	
	await browser.close();
}

main().catch((e) => {
	console.error('Фатальная ошибка скрипта:', e);
});
