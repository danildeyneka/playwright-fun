export const getTimeStamp = () => {
	const date = new Date();
	const formatter = new Intl.DateTimeFormat('ru-RU', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	})
	
	const time = formatter.format(date).replace(/:/g, '.');
	
	return date.toLocaleDateString('ru-RU') + '-' + time;
}