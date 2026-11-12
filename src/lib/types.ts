export type Meal = "breakfast" | "lunch" | "dinner" | "snack";

export type Mood = "empty" | "quiet" | "ok" | "binge" | "numb" | "rage";

export type FoodTag = "safe" | "red" | "liquid";

export interface Food {
  id: string;
  name: string;
  kcal: number;
  p: number;
  f: number;
  c: number;
  tags: FoodTag[];
  portion?: number;
  custom?: boolean;
}

export interface Entry {
  id: string;
  date: string;
  meal: Meal;
  foodId: string;
  name: string;
  grams: number;
  kcal: number;
  p: number;
  f: number;
  c: number;
  createdAt: number;
  note?: string;
}

export interface Note {
  id: string;
  date: string;
  text: string;
  mood: Mood;
  createdAt: number;
}

export interface Profile {
  name: string;
  goalKcal: number;
  goalWater: number;
  height: number;
  startWeight: number;
  goalWeight: number;
  createdAt: number;
}

export interface Settings {
  hideNumbers: boolean;
  reduceMotion: boolean;
  compact: boolean;
}

export interface DayData {
  water: number;
}

export interface AppState {
  version: number;
  profile: Profile;
  entries: Entry[];
  days: Record<string, DayData>;
  weights: Record<string, number>;
  notes: Note[];
  customFoods: Food[];
  settings: Settings;
  introSeen: boolean;
}

export interface Totals {
  kcal: number;
  p: number;
  f: number;
  c: number;
}

export const EMPTY_TOTALS: Totals = { kcal: 0, p: 0, f: 0, c: 0 };
