import { chromium } from 'playwright';

const COVER_LETTER = `Здравствуйте, я - Данила Сергеевич, Frontend разработчик с коммерческим опытом 4,5 года (больше 2х из которых - финтех).
Работал со всем стеком вакансии, Typescript + React - основной. Работаю со вебом и SEO, умею делать telegram ботов на NodeJS.
Оперативно отвечу в telegram - @frontendick`;

const VACANCY_URL = 'https://hh.ru/search/vacancy?text=Frontend&excluded_text=&area=1&salary=&salary=&currency_code=RUR&experience=doesNotMatter&order_by=relevance&search_period=0&items_on_page=100&L_save_area=true&hhtmFrom=vacancy_search_filter';

(async () => {
	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext();
	const page = await context.newPage();
	
	try {
		console.log('📍 Переходим на страницу поиска...');
		await page.goto(VACANCY_URL, { waitUntil: 'networkidle' });
		await page.waitForTimeout(2000);
		
		// Получаем все ссылки на вакансии
		const vacancyLinks = await page.locator('a[href*="/vacancy/"]').all();
		const uniqueLinks = new Set();
		
		for (const link of vacancyLinks) {
			const href = await link.getAttribute('href');
			if (href && href.includes('/vacancy/')) {
				uniqueLinks.add(href);
			}
		}
		
		console.log(`✅ Найдено ${uniqueLinks.size} вакансий`);
		
		let processedCount = 0;
		let skippedCount = 0;
		const skippedVacancies = [];
		
		for (const vacancyLink of Array.from(uniqueLinks).slice(0, 100)) {
			try {
				const vacancyPage = await context.newPage();
				const fullUrl = 'https://hh.ru' + vacancyLink;
				
				console.log(`\n📄 Открываем вакансию: ${vacancyLink}`);
				await vacancyPage.goto(fullUrl, { waitUntil: 'networkidle' });
				await vacancyPage.waitForTimeout(1000); // Имитация просмотра вакансии
				
				// Проверяем, есть ли кнопка "Откликнуться"
				const respondButton = await vacancyPage.locator('button:has-text("Откликнуться")').first();
				
				if (!await respondButton.isVisible()) {
					console.log('⚠️  Кнопка откликнуться не найдена');
					skippedVacancies.push({ url: vacancyLink, reason: 'Кнопка не найдена' });
					skippedCount++;
					await vacancyPage.close();
					continue;
				}
				
				// Нажимаем на кнопку "Откликнуться"
				console.log('🔵 Нажимаем кнопку откликнуться...');
				await respondButton.click();
				await vacancyPage.waitForTimeout(1000);
				
				// Проверяем, есть ли вопросник (опросник)
				const questionnaireField = await vacancyPage.locator('text="Ответьте на вопросы"').isVisible().catch(() => false);
				
				if (questionnaireField) {
					console.log('❓ Обнаружен опросник - оставляем вакансию открытой');
					skippedVacancies.push({ url: vacancyLink, reason: 'Опросник' });
					// Не закрываем страницу, оставляем открытой
					skippedCount++;
					continue;
				}
				
				// Проверяем, не отклонили ли уже
				const alreadyResponded = await vacancyPage.locator('text="Вы откликнулись"').isVisible().catch(() => false);
				if (alreadyResponded) {
					console.log('✅ Уже отклинулись на эту вакансию');
					skippedCount++;
					await vacancyPage.close();
					continue;
				}
				
				// Ищем поле для сопроводительного письма
				const coverLetterButton = await vacancyPage.locator('button:has-text("Добавить сопроводительное")').first();
				
				if (await coverLetterButton.isVisible()) {
					console.log('📝 Добавляем сопроводительное письмо...');
					await coverLetterButton.click();
					await vacancyPage.waitForTimeout(500);
					
					// Заполняем поле письма
					const letterInput = await vacancyPage.locator('textarea, [contenteditable="true"]').first();
					if (await letterInput.isVisible()) {
						await letterInput.click();
						await letterInput.fill(COVER_LETTER);
						console.log('✏️  Письмо добавлено');
					}
				}
				
				// Ищем финальную кнопку отправки
				const submitButton = await vacancyPage.locator('button:has-text("Отправить"), button:has-text("Откликнуться")').last();
				
				if (await submitButton.isVisible()) {
					console.log('📤 Отправляем отклик...');
					await submitButton.click();
					await vacancyPage.waitForTimeout(1000);
					
					// Проверяем подтверждение
					const confirmation = await vacancyPage.locator('text="Отклик отправлен"').isVisible().catch(() => false);
					if (confirmation) {
						console.log('✅ Отклик успешно отправлен!');
						processedCount++;
					} else {
						console.log('⚠️  Подтверждение не получено');
					}
				}
				
				// Закрываем страницу вакансии
				await vacancyPage.close();
				
			} catch (error) {
				console.error(`❌ Ошибка при обработке вакансии: ${error}`);
				skippedCount++;
			}
			
			// Небольшая пауза между запросами
			await page.waitForTimeout(500);
		}
		
		console.log(`\n\n${'='.repeat(50)}`);
		console.log('📊 ИТОГОВАЯ СТАТИСТИКА');
		console.log(`${'='.repeat(50)}`);
		console.log(`✅ Успешно отправлено откликов: ${processedCount}`);
		console.log(`⚠️  Пропущено вакансий: ${skippedCount}`);
		
		if (skippedVacancies.length > 0) {
			console.log(`\n📝 Вакансии с опросниками (оставлены открытыми):`);
			skippedVacancies.forEach((v, i) => {
				console.log(`  ${i + 1}. ${v.url} (${v.reason})`);
			});
		}
		
		console.log(`\n✨ Обработка завершена! Все вакансии на странице обработаны.`);
		
	} catch (error) {
		console.error('Fatal error:', error);
	} finally {
		// Не закрываем браузер сразу, чтобы увидеть результаты
		console.log('\n⏳ Браузер остается открытым. Закройте вручную когда закончите.');
		// await browser.close();
	}
})();