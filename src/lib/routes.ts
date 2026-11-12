import type { IconName } from "../components/Icon";

export interface RouteMeta {
  id: "today" | "diary" | "search" | "history" | "stats" | "notes" | "profile";
  label: string;
  title: string;
  icon: IconName;
  index: string;
}

export const ROUTES: RouteMeta[] = [
  { id: "today", label: "сегодня", title: "Сегодня", icon: "today", index: "01" },
  { id: "diary", label: "дневник", title: "Дневник", icon: "diary", index: "02" },
  { id: "search", label: "поиск", title: "Поиск", icon: "search", index: "03" },
  { id: "history", label: "история", title: "История", icon: "history", index: "04" },
  { id: "stats", label: "статистика", title: "Статистика", icon: "stats", index: "05" },
  { id: "notes", label: "заметки", title: "Заметки", icon: "notes", index: "06" },
  { id: "profile", label: "профиль", title: "Профиль", icon: "profile", index: "07" },
];

export type Route = RouteMeta["id"];

export const MOBILE_ROUTES: Route[] = ["today", "diary", "search", "stats"];

export function routeMeta(id: Route): RouteMeta {
  return ROUTES.find((r) => r.id === id) ?? ROUTES[0];
}
