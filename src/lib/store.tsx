import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { BUILTIN_FOODS } from "../data/foods";
import { r1 } from "./calc";
import { todayISO } from "./date";
import { blankState, seedState } from "./seed";
import type { AppState, Entry, Food, FoodTag, Meal, Mood, Note } from "./types";

const STORAGE_KEY = "hungry.v2";

function uid(prefix = "e"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function mergeState(raw: unknown): AppState {
  const base = blankState();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Partial<AppState>;
  return {
    ...base,
    ...obj,
    profile: { ...base.profile, ...(obj.profile ?? {}) },
    settings: { ...base.settings, ...(obj.settings ?? {}) },
    entries: Array.isArray(obj.entries) ? obj.entries : [],
    notes: Array.isArray(obj.notes) ? obj.notes : [],
    customFoods: Array.isArray(obj.customFoods) ? obj.customFoods : [],
    days: obj.days && typeof obj.days === "object" ? obj.days : {},
    weights: obj.weights && typeof obj.weights === "object" ? obj.weights : {},
    introSeen: obj.introSeen ?? true,
  };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return mergeState(JSON.parse(raw));
  } catch {
    /* ignore corrupted storage */
  }
  return seedState();
}

export interface NewEntryInput {
  date: string;
  meal: Meal;
  food: Food;
  grams: number;
  note?: string;
}

export interface StoreApi {
  state: AppState;
  foods: Food[];
  addEntry: (input: NewEntryInput) => Entry;
  updateEntry: (id: string, patch: { grams?: number; meal?: Meal; note?: string; date?: string }) => void;
  removeEntry: (id: string) => Entry | undefined;
  restoreEntry: (entry: Entry) => void;
  addWater: (date: string, delta: number) => void;
  setWater: (date: string, ml: number) => void;
  setWeight: (date: string, kg: number) => void;
  addNote: (text: string, mood: Mood, date?: string) => void;
  removeNote: (id: string) => void;
  addCustomFood: (food: { name: string; kcal: number; p: number; f: number; c: number }) => Food;
  removeCustomFood: (id: string) => void;
  setProfile: (patch: Partial<AppState["profile"]>) => void;
  setSettings: (patch: Partial<AppState["settings"]>) => void;
  setIntroSeen: (v: boolean) => void;
  resetAll: () => void;
  loadDemo: () => void;
  exportJson: () => string;
  importJson: (text: string) => boolean;
}

const StoreContext = createContext<StoreApi | null>(null);

function deriveTags(kcal: number): FoodTag[] {
  const tags: FoodTag[] = [];
  if (kcal <= 70) tags.push("safe");
  if (kcal >= 400) tags.push("red");
  return tags;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage may be full or unavailable */
    }
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.privacy = state.settings.hideNumbers ? "on" : "off";
    root.dataset.motion = state.settings.reduceMotion ? "reduced" : "full";
    root.dataset.compact = state.settings.compact ? "on" : "off";
  }, [state.settings]);

  const foods = useMemo<Food[]>(
    () => [...BUILTIN_FOODS, ...state.customFoods],
    [state.customFoods],
  );

  const addEntry = useCallback((input: NewEntryInput): Entry => {
    const k = input.grams / 100;
    const entry: Entry = {
      id: uid("entry"),
      date: input.date,
      meal: input.meal,
      foodId: input.food.id,
      name: input.food.name,
      grams: input.grams,
      kcal: r1(input.food.kcal * k),
      p: r1(input.food.p * k),
      f: r1(input.food.f * k),
      c: r1(input.food.c * k),
      createdAt: Date.now(),
      note: input.note,
    };
    setState((s) => ({ ...s, entries: [...s.entries, entry] }));
    return entry;
  }, []);

  const updateEntry = useCallback<StoreApi["updateEntry"]>((id, patch) => {
    setState((s) => {
      const allFoods = [...BUILTIN_FOODS, ...s.customFoods];
      return {
        ...s,
        entries: s.entries.map((entry) => {
          if (entry.id !== id) return entry;
          let next: Entry = { ...entry, ...patch };
          if (patch.grams !== undefined && patch.grams !== entry.grams) {
            const food = allFoods.find((f) => f.id === entry.foodId);
            const ratio = patch.grams / entry.grams;
            if (food) {
              const k = patch.grams / 100;
              next = {
                ...next,
                grams: patch.grams,
                kcal: r1(food.kcal * k),
                p: r1(food.p * k),
                f: r1(food.f * k),
                c: r1(food.c * k),
              };
            } else {
              next = {
                ...next,
                grams: patch.grams,
                kcal: r1(entry.kcal * ratio),
                p: r1(entry.p * ratio),
                f: r1(entry.f * ratio),
                c: r1(entry.c * ratio),
              };
            }
          }
          return next;
        }),
      };
    });
  }, []);

  const removeEntry = useCallback(
    (id: string) => {
      const found = state.entries.find((e) => e.id === id);
      setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));
      return found;
    },
    [state.entries],
  );

  const restoreEntry = useCallback((entry: Entry) => {
    setState((s) => ({ ...s, entries: [...s.entries, entry] }));
  }, []);

  const addWater = useCallback((date: string, delta: number) => {
    setState((s) => {
      const current = s.days[date]?.water ?? 0;
      const next = Math.max(0, Math.min(10000, current + delta));
      return { ...s, days: { ...s.days, [date]: { water: next } } };
    });
  }, []);

  const setWater = useCallback((date: string, ml: number) => {
    setState((s) => ({
      ...s,
      days: { ...s.days, [date]: { water: Math.max(0, Math.min(10000, Math.round(ml))) } },
    }));
  }, []);

  const setWeight = useCallback((date: string, kg: number) => {
    setState((s) => {
      const weights = { ...s.weights };
      if (!kg || kg <= 0) delete weights[date];
      else weights[date] = Math.round(kg * 10) / 10;
      return { ...s, weights };
    });
  }, []);

  const addNote = useCallback((text: string, mood: Mood, date?: string) => {
    const note: Note = {
      id: uid("note"),
      date: date ?? todayISO(),
      text: text.trim(),
      mood,
      createdAt: Date.now(),
    };
    setState((s) => ({ ...s, notes: [note, ...s.notes] }));
  }, []);

  const removeNote = useCallback((id: string) => {
    setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
  }, []);

  const addCustomFood = useCallback<StoreApi["addCustomFood"]>((data) => {
    const food: Food = {
      id: uid("food"),
      name: data.name.trim(),
      kcal: r1(data.kcal),
      p: r1(data.p),
      f: r1(data.f),
      c: r1(data.c),
      tags: deriveTags(data.kcal),
      portion: 100,
      custom: true,
    };
    setState((s) => ({ ...s, customFoods: [...s.customFoods, food] }));
    return food;
  }, []);

  const removeCustomFood = useCallback((id: string) => {
    setState((s) => ({ ...s, customFoods: s.customFoods.filter((f) => f.id !== id) }));
  }, []);

  const setProfile = useCallback((patch: Partial<AppState["profile"]>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  }, []);

  const setSettings = useCallback((patch: Partial<AppState["settings"]>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const setIntroSeen = useCallback((v: boolean) => {
    setState((s) => ({ ...s, introSeen: v }));
  }, []);

  const resetAll = useCallback(() => {
    setState((s) => {
      const next = blankState();
      next.profile.name = s.profile.name;
      next.profile.goalKcal = s.profile.goalKcal;
      next.profile.goalWater = s.profile.goalWater;
      next.profile.height = s.profile.height;
      next.settings = s.settings;
      // Wiping data is not a first visit: keep the user inside the app
      // instead of replaying the intro on the next reload.
      next.introSeen = true;
      return next;
    });
  }, []);

  const loadDemo = useCallback(() => {
    setState((s) => {
      const demo = seedState();
      demo.settings = s.settings;
      demo.introSeen = true;
      return demo;
    });
  }, []);

  const exportJson = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const importJson = useCallback((text: string) => {
    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object") return false;
      const next = mergeState(parsed);
      next.introSeen = true;
      setState(next);
      return true;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo<StoreApi>(
    () => ({
      state,
      foods,
      addEntry,
      updateEntry,
      removeEntry,
      restoreEntry,
      addWater,
      setWater,
      setWeight,
      addNote,
      removeNote,
      addCustomFood,
      removeCustomFood,
      setProfile,
      setSettings,
      setIntroSeen,
      resetAll,
      loadDemo,
      exportJson,
      importJson,
    }),
    [
      state, foods, addEntry, updateEntry, removeEntry, restoreEntry, addWater,
      setWater, setWeight, addNote, removeNote, addCustomFood, removeCustomFood,
      setProfile, setSettings, setIntroSeen, resetAll, loadDemo, exportJson, importJson,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
