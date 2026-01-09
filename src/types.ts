export const STATUSES = {
	SUCCESS: 'success',
	FAILURE: 'failure',
	OTHER: 'other',
};

export type ResponseStatus = typeof STATUSES[keyof typeof STATUSES];