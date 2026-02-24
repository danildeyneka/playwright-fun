import {
	COVER_LETTER,
	VACANCIES_LIST,
	VACANCIES_LIST_ZARPLATA
} from '../params.ts';

export const checkEnv = (isZarplataRu?: boolean) => {
	if (!COVER_LETTER || (isZarplataRu ? !VACANCIES_LIST_ZARPLATA : !VACANCIES_LIST)) {
		console.log('Заполните обязательные параметры в файле params.ts');
		process.exit(0);
	}
}