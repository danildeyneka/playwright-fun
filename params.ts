// &area=113 - РФ, search_field=name - поиск по названию вакансии
export const VACANCIES_LIST = 'https://hh.ru/search/vacancy?text=Frontend&search_field=name&order_by=relevance';
export const VACANCIES_LIST_ZARPLATA = 'https://zarplata.ru/search/vacancy?text=Frontend&search_field=name&order_by=relevance';
export const COVER_LETTER = 'Здравствуйте, я - Данила Сергеевич, Frontend-разработчик, 5 лет коммерческого опыта (финтех, логистика, телеком).\n' +
	'Работал со всем стеком вакансии, Typescript + React - основной. Работаю со вебом, SEO, CI/CD.\n' +
	'Рассматриваю удаленный формат работы.\n' +
	'Telegram - @frontendick'
// скрывать вакансию после обработки
export const AUTO_HIDE_VACANCY = true;
// eng/rus ключевые слова должности в названии вакансии
export const VACANCY_TITLE_FILTER = 'frontend,фронтенд,react,реакт'