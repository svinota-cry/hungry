const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

const MONTHS_SHORT = [
  "янв", "фев", "мар", "апр", "май", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];

const MONTHS_NOM = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];

const WEEKDAYS_SHORT = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];
const WEEKDAYS_LONG = [
  "воскресенье", "понедельник", "вторник", "среда",
  "четверг", "пятница", "суббота",
];

export function dateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return dateISO(new Date());
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return dateISO(d);
}

export function monthRu(iso: string): string {
  return MONTHS[parseISO(iso).getMonth()];
}

export function monthShortRu(iso: string): string {
  return MONTHS_SHORT[parseISO(iso).getMonth()];
}

export function weekdayShort(iso: string): string {
  return WEEKDAYS_SHORT[parseISO(iso).getDay()];
}

export function monthTitle(year: number, month: number): string {
  return `${MONTHS_NOM[month]} ${year}`;
}

export function weekdayLong(iso: string): string {
  return WEEKDAYS_LONG[parseISO(iso).getDay()];
}

export function dayNum(iso: string): number {
  return parseISO(iso).getDate();
}

export function formatDateRu(iso: string): string {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatDateFullRu(iso: string): string {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function relativeDay(iso: string): string {
  const today = todayISO();
  if (iso === today) return "сегодня";
  if (iso === addDays(today, -1)) return "вчера";
  if (iso === addDays(today, -2)) return "позавчера";
  if (iso === addDays(today, 1)) return "завтра";
  return formatDateRu(iso);
}

export function timeLabel(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function startOfWeek(iso: string): string {
  const d = parseISO(iso);
  const day = (d.getDay() + 6) % 7; // monday = 0
  d.setDate(d.getDate() - day);
  return dateISO(d);
}

export function daysBetween(a: string, b: string): number {
  const ms = parseISO(b).getTime() - parseISO(a).getTime();
  return Math.round(ms / 86400000);
}

export function monthMatrix(year: number, month: number): string[][] {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  const offset = (first.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  const weeks: string[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < 6; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(dateISO(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}
