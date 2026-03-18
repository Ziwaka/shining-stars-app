const MM_TZ = 'Asia/Yangon';

export const getTodayMM = () => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: MM_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const parts = formatter.formatToParts(new Date());
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    
    return `${year}-${month}-${day}`;
  } catch(e) {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
};

export const formatMMDate = (d) => {
  if (!d || d === '-') return '-';
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return String(d).split('T')[0];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return String(d).split('T')[0];
  }
};

export const formatDateDisplay = (d) => {
  if (!d || d === '-') return '-';
  try {
    const cleanD = String(d).split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanD)) return cleanD;
    const [year, month, day] = cleanD.split('-');
    const date = new Date(year, month - 1, day);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `${day}/${month}/${year}, ${weekday}`;
  } catch(e) { 
    return formatMMDate(d); 
  }
};

export const getDisplayName = (s) => {
  return s['Name (ALL CAPITAL)'] || s['အမည်'] || s.Name || '';
};