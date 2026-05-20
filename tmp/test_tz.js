
function convertLocalToUTC(localDateTimeStr, targetTimezone) {
  if (!localDateTimeStr) return '';
  const date = new Date(localDateTimeStr);
  if (isNaN(date.getTime())) return '';

  if (targetTimezone === 'browser' || !targetTimezone) {
    return date.toISOString();
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimezone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
    });
    
    const parts = formatter.formatToParts(date);
    const p = {};
    parts.forEach(part => { p[part.type] = part.value; });
    
    const utcOfTarget = new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute));
    const offsetMs = date.getTime() - utcOfTarget.getTime();
    
    return new Date(date.getTime() + offsetMs).toISOString();
  } catch (e) {
    return date.toISOString();
  }
}

const localDateTimeStr = '2026-05-21T02:00'; 
console.log('Test string:', localDateTimeStr);
console.log('Asia/Kolkata Result:', convertLocalToUTC(localDateTimeStr, 'Asia/Kolkata'));
console.log('Browser Result (assuming local is IST):', convertLocalToUTC(localDateTimeStr, 'browser'));
console.log('Expected for 2AM IST:', '2026-05-20T20:30:00.000Z');
