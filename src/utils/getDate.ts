export function adjustForTimezone(date: Date, tz = '3') {
  date.setHours(date.getHours() + Number(tz));

  return date;
}

export function getDate(tz = '3') {
  const d = new Date();
  const dateUtc = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
  const dateObj = adjustForTimezone(dateUtc, tz);

  const day = ('0' + dateObj.getDate()).slice(-2);
  const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
  const year = dateObj.getFullYear();
  const hours = ('0' + dateObj.getHours()).slice(-2);
  const minutes = ('0' + dateObj.getMinutes()).slice(-2);

  return {
    day,
    month,
    year,
    hours,
    minutes,
  }
}
