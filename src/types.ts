export const STATUSES = {
	SUCCESS: 'success',
	FAILURE: 'failure',
};

export type ResponseStatus = typeof STATUSES[keyof typeof STATUSES];

export type VacancyData = {
	id: number;
	position: string;
	salary: number;
	experience: string;
	isRemote: boolean;
}

export type VacancyResponse = {
	status: ResponseStatus;
	data?: VacancyData;
}