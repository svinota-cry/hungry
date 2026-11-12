import { BUILTIN_FOODS } from "../data/foods";
import { addDays, parseISO, todayISO } from "./date";
import type { AppState, Entry, Meal, Mood, Note } from "./types";

const FOOD = new Map(BUILTIN_FOODS.map((f) => [f.name, f]));

function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const TEMPLATES: { meal: Meal; food: string; grams: [number, number]; hour: number }[][] = [
  [
    { meal: "breakfast", food: "Овсянка на воде", grams: [180, 240], hour: 8 },
    { meal: "breakfast", food: "Кофе чёрный", grams: [200, 300], hour: 8 },
    { meal: "lunch", food: "Куриная грудка отварная", grams: [140, 200], hour: 13 },
    { meal: "lunch", food: "Рис отварной", grams: [120, 200], hour: 13 },
    { meal: "lunch", food: "Огурец", grams: [80, 150], hour: 13 },
    { meal: "dinner", food: "Греческий салат", grams: [150, 250], hour: 19 },
    { meal: "snack", food: "Яблоко", grams: [120, 200], hour: 16 },
  ],
  [
    { meal: "breakfast", food: "Яйцо куриное", grams: [100, 120], hour: 9 },
    { meal: "breakfast", food: "Тост", grams: [40, 70], hour: 9 },
    { meal: "breakfast", food: "Кофе с молоком", grams: [200, 300], hour: 9 },
    { meal: "lunch", food: "Гречка отварная", grams: [150, 220], hour: 14 },
    { meal: "lunch", food: "Лосось", grams: [100, 160], hour: 14 },
    { meal: "dinner", food: "Суп куриный", grams: [250, 350], hour: 20 },
    { meal: "dinner", food: "Хлеб ржаной", grams: [30, 60], hour: 20 },
    { meal: "snack", food: "Шоколад тёмный", grams: [15, 40], hour: 17 },
  ],
  [
    { meal: "breakfast", food: "Гранола", grams: [40, 70], hour: 8 },
    { meal: "breakfast", food: "Греческий йогурт", grams: [120, 200], hour: 8 },
    { meal: "lunch", food: "Макароны отварные", grams: [180, 260], hour: 13 },
    { meal: "lunch", food: "Куриное бедро", grams: [100, 160], hour: 13 },
    { meal: "dinner", food: "Омлет", grams: [150, 220], hour: 19 },
    { meal: "snack", food: "Банан", grams: [100, 150], hour: 16 },
  ],
  [
    { meal: "breakfast", food: "Творог 5%", grams: [150, 220], hour: 9 },
    { meal: "breakfast", food: "Банан", grams: [100, 140], hour: 9 },
    { meal: "lunch", food: "Шаурма", grams: [220, 320], hour: 14 },
    { meal: "dinner", food: "Треска", grams: [130, 190], hour: 20 },
    { meal: "dinner", food: "Брокколи", grams: [120, 200], hour: 20 },
    { meal: "snack", food: "Мороженое", grams: [60, 110], hour: 21 },
  ],
  [
    { meal: "breakfast", food: "Круассан", grams: [60, 90], hour: 9 },
    { meal: "breakfast", food: "Латте", grams: [200, 300], hour: 9 },
    { meal: "lunch", food: "Суши ролл", grams: [180, 260], hour: 14 },
    { meal: "dinner", food: "Борщ", grams: [250, 350], hour: 19 },
    { meal: "dinner", food: "Хлеб цельнозерновой", grams: [30, 50], hour: 19 },
    { meal: "snack", food: "Клубника", grams: [100, 200], hour: 17 },
  ],
  [
    { meal: "breakfast", food: "Протеиновый коктейль", grams: [250, 350], hour: 8 },
    { meal: "lunch", food: "Индейка филе", grams: [150, 220], hour: 13 },
    { meal: "lunch", food: "Булгур отварной", grams: [140, 200], hour: 13 },
    { meal: "lunch", food: "Брокколи", grams: [100, 180], hour: 13 },
    { meal: "dinner", food: "Тофу", grams: [150, 220], hour: 19 },
    { meal: "dinner", food: "Перец болгарский", grams: [100, 180], hour: 19 },
    { meal: "snack", food: "Миндаль", grams: [15, 35], hour: 16 },
  ],
  [
    { meal: "breakfast", food: "Овсянка на молоке", grams: [180, 260], hour: 8 },
    { meal: "breakfast", food: "Черника", grams: [60, 120], hour: 8 },
    { meal: "lunch", food: "Бургер", grams: [180, 260], hour: 14 },
    { meal: "lunch", food: "Картофель фри", grams: [80, 140], hour: 14 },
    { meal: "dinner", food: "Оливье", grams: [150, 230], hour: 20 },
    { meal: "snack", food: "Печенье", grams: [30, 60], hour: 17 },
  ],
];

const NOTES: { offset: number; mood: Mood; text: string }[] = [
  { offset: -2, mood: "numb", text: "День прошёл мимо. Ела по инерции, не помню вкуса." },
  { offset: -5, mood: "quiet", text: "Не считала вечер. Просто закрыла приложение и легла." },
  { offset: -9, mood: "binge", text: "Срыв. Всё, что было в шкафу. Завтра не будет завтра." },
  { offset: -13, mood: "ok", text: "Обычный день. Впервые за неделю без паники у зеркала." },
  { offset: -18, mood: "empty", text: "Пусто. Не голод, не сытость. Просто пусто." },
];

export function seedState(): AppState {
  const today = todayISO();
  const entries: Entry[] = [];
  const weights: Record<string, number> = {};
  const days: Record<string, { water: number }> = {};
  const notes: Note[] = [];
  let counter = 0;
  const nowHour = new Date().getHours();

  for (let i = 27; i >= 0; i--) {
    const date = addDays(today, -i);
    const rng = makeRng(hash(date));
    const skip = i !== 0 && rng() < 0.12;
    const tpl = TEMPLATES[Math.floor(rng() * TEMPLATES.length)];
    if (!skip) {
      for (const item of tpl) {
        if (i === 0 && item.hour > nowHour) continue;
        const food = FOOD.get(item.food);
        if (!food) continue;
        const grams = Math.round(item.grams[0] + rng() * (item.grams[1] - item.grams[0]));
        const k = grams / 100;
        entries.push({
          id: `seed-${++counter}`,
          date,
          meal: item.meal,
          foodId: food.id,
          name: food.name,
          grams,
          kcal: r1(food.kcal * k),
          p: r1(food.p * k),
          f: r1(food.f * k),
          c: r1(food.c * k),
          createdAt: parseISO(date).getTime() + item.hour * 3600000 + counter * 1000,
        });
      }
      days[date] = { water: Math.round((900 + rng() * 1500) / 50) * 50 };
    } else {
      days[date] = { water: Math.round((300 + rng() * 700) / 50) * 50 };
    }

    if (i <= 24 && rng() > 0.18) {
      const trend = 68.4 - (24 - i) * 0.055;
      weights[date] = Math.round((trend + (rng() - 0.5) * 0.55) * 10) / 10;
    }
  }

  for (const n of NOTES) {
    const date = addDays(today, n.offset);
    notes.push({
      id: `seed-note-${Math.abs(n.offset)}`,
      date,
      text: n.text,
      mood: n.mood,
      createdAt: parseISO(date).getTime() + 21 * 3600000,
    });
  }

  return {
    version: 2,
    profile: {
      name: "аноним",
      goalKcal: 1900,
      goalWater: 2000,
      height: 172,
      startWeight: 68.4,
      goalWeight: 64,
      createdAt: Date.now() - 30 * 86400000,
    },
    entries,
    days,
    weights,
    notes,
    customFoods: [],
    settings: { hideNumbers: false, reduceMotion: false, compact: false },
    introSeen: false,
  };
}

export function blankState(): AppState {
  return {
    version: 2,
    profile: {
      name: "",
      goalKcal: 2000,
      goalWater: 2000,
      height: 170,
      startWeight: 0,
      goalWeight: 0,
      createdAt: Date.now(),
    },
    entries: [],
    days: {},
    weights: {},
    notes: [],
    customFoods: [],
    settings: { hideNumbers: false, reduceMotion: false, compact: false },
    introSeen: true,
  };
}
