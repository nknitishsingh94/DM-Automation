
function convertLocalToUTC(localDateTimeStr, targetTimezone) {
  if (!localDateTimeStr) return '';
  
  const [datePart, timePart] = localDateTimeStr.split('T');
  if (!datePart || !timePart) return new Date(localDateTimeStr).toISOString();
  
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  if (targetTimezone === 'browser' || !targetTimezone) {
    const d = new Date(year, month - 1, day, hour, minute);
    return d.toISOString();
  }

  try {
    const d = new Date(Date.UTC(year, month - 1, day, hour, minute));
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimezone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
    });
    
    const parts = formatter.formatToParts(d);
    const p = {};
    parts.forEach(part => { p[part.type] = part.value; });
    const localOfTest = new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute));
    const offset = d.getTime() - localOfTest.getTime();
    return new Date(d.getTime() + offset).toISOString();
  } catch (e) {
    return new Date(localDateTimeStr).toISOString();
  }
}

const localDateTimeStr = '2026-05-21T02:00'; 
console.log('Test string:', localDateTimeStr);
console.log('Asia/Kolkata Result:', convertLocalToUTC(localDateTimeStr, 'Asia/Kolkata'));
console.log('Expected for 2AM IST (UTC+5.5):', '2026-05-20T20:30:00.000Z');

const dubaiTime = '2026-05-21T02:00'; // 2 AM Dubai (UTC+4)
console.log('Dubai Result:', convertLocalToUTC(dubaiTime, 'Asia/Dubai'));
console.log('Expected for 2AM Dubai:', '2026-05-20T22:00:00.000Z');
