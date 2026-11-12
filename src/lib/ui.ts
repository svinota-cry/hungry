import type { Route } from "./routes";
import { createContext, useContext } from "react";
import type { Entry, Food, Meal } from "./types";

export interface NotifyAction {
  label: string;
  onClick: () => void;
}

export interface UIContextValue {
  notify: (text: string, action?: NotifyAction) => void;
  openAdd: (opts?: { date?: string; meal?: Meal; food?: Food }) => void;
  openEdit: (entry: Entry) => void;
  diaryDate: string;
  setDiaryDate: (date: string) => void;
  go: (route: Route) => void;
}

export const UIContext = createContext<UIContextValue | null>(null);

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside UI provider");
  return ctx;
}
