export const STATUSES = {
	SUCCESS: 'success',
	FAILURE: 'failure',
};

export type ResponseStatus = typeof STATUSES[keyof typeof STATUSES];