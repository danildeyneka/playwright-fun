import type { Page } from 'playwright';

export async function closePopup(page: Page) {
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