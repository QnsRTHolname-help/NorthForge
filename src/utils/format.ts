export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.round((now - then) / 1000);
  const future = diff < 0;
  const s = Math.abs(diff);
  const map: [number, string][] = [
    [60, 'second'], [3600, 'minute'], [86400, 'hour'], [604800, 'day'], [2629800, 'week'], [31557600, 'month'],
  ];
  let unit = 'year', value = Math.round(s / 31557600);
  let prev = 1;
  for (const [limit, name] of map) {
    if (s < limit) { unit = name; value = Math.max(1, Math.round(s / prev)); break; }
    prev = limit;
  }
  // fix off-by mapping
  if (s < 60) { value = Math.max(1, s); unit = 'second'; }
  else if (s < 3600) { value = Math.round(s / 60); unit = 'minute'; }
  else if (s < 86400) { value = Math.round(s / 3600); unit = 'hour'; }
  else if (s < 604800) { value = Math.round(s / 86400); unit = 'day'; }
  else if (s < 2629800) { value = Math.round(s / 604800); unit = 'week'; }
  else if (s < 31557600) { value = Math.round(s / 2629800); unit = 'month'; }
  else { value = Math.round(s / 31557600); unit = 'year'; }
  const plural = value === 1 ? unit : unit + 's';
  return future ? `in ${value} ${plural}` : `${value} ${plural} ago`;
}

export function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString('en-IN', opts || { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export const compact = (n: number) => {
  if (n >= 1e7) return (n / 1e7).toFixed(1) + 'Cr';
  if (n >= 1e5) return (n / 1e5).toFixed(1) + 'L';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
};

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
