import { addDays, todayISO } from "./date";
import type { Entry, Food, Totals } from "./types";

export function round(n: number): number {
  return Math.round(n);
}

export function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function entriesOn(entries: Entry[], date: string): Entry[] {
  return entries.filter((e) => e.date === date).sort((a, b) => a.createdAt - b.createdAt);
}

export function totalsFor(entries: Entry[]): Totals {
  return entries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      p: acc.p + e.p,
      f: acc.f + e.f,
      c: acc.c + e.c,
    }),
    { kcal: 0, p: 0, f: 0, c: 0 },
  );
}

export function entryFromFood(food: Food, grams: number): Omit<Entry, "id" | "date" | "meal" | "createdAt"> {
  const k = grams / 100;
  return {
    foodId: food.id,
    name: food.name,
    grams,
    kcal: r1(food.kcal * k),
    p: r1(food.p * k),
    f: r1(food.f * k),
    c: r1(food.c * k),
  };
}

export function fmt(n: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);
}

export function fmt1(n: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(n);
}

export function pct(part: number, total: number): number {
  if (!total) return 0;
  return clamp((part / total) * 100, 0, 100);
}

export function streak(entries: Entry[]): number {
  const dates = new Set(entries.map((e) => e.date));
  let cursor = todayISO();
  if (!dates.has(cursor)) cursor = addDays(cursor, -1);
  let count = 0;
  while (dates.has(cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function daysLogged(entries: Entry[]): number {
  return new Set(entries.map((e) => e.date)).size;
}

export function macroKcal(p: number, f: number, c: number): { p: number; f: number; c: number } {
  const pk = p * 4;
  const fk = f * 9;
  const ck = c * 4;
  const total = pk + fk + ck || 1;
  return { p: (pk / total) * 100, f: (fk / total) * 100, c: (ck / total) * 100 };
}

export function lastNDates(n: number, end = todayISO()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(end, -i));
  return out;
}
