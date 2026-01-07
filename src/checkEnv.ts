import { COVER_LETTER, VACANCIES_LIST } from '../params.ts';

export const checkEnv = () => {
	if (!COVER_LETTER || !VACANCIES_LIST) {
		console.log('Заполните обязательные параметры в файле params.ts');
		process.exit(0);
	}
}