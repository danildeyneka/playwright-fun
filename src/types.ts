export const STATUSES = {
	SUCCESS: 'success',
	FAILURE: 'failure',
};

export type ResponseStatus = typeof STATUSES[keyof typeof STATUSES];

export type VacancyData = {
	link: string;
	questionnaire: string;
	position: string;
	salary: string;
	experience: string;
	isRemote: boolean;
}

export type VacancyResponse = {
	status: ResponseStatus;
	data?: VacancyData;
}