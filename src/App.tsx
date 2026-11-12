import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StoreProvider, useStore } from "./lib/store";
import { UIContext, type NotifyAction } from "./lib/ui";
import { ROUTES, type Route } from "./lib/routes";
import { todayISO } from "./lib/date";
import type { Entry, Food, Meal } from "./lib/types";
import { Shell } from "./components/Shell";
import { FoodModal, type EditorState } from "./components/FoodModal";
import { Toast, type ToastData } from "./components/ui";
import { Onboarding } from "./components/Onboarding";
import { Today } from "./views/Today";
import { Diary } from "./views/Diary";
import { Search } from "./views/Search";
import { History } from "./views/History";
import { Stats } from "./views/Stats";
import { Notes } from "./views/Notes";
import { Profile } from "./views/Profile";

function routeFromHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return (ROUTES.some((r) => r.id === h) ? h : "today") as Route;
}

function Root() {
  const store = useStore();
  const [route, setRoute] = useState<Route>(routeFromHash);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [intro, setIntro] = useState(!store.state.introSeen);
  const [diaryDate, setDiaryDate] = useState(todayISO());
  const seq = useRef(0);

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", onHash);
    if (!window.location.hash) {
      window.history.replaceState(null, "", "#/today");
    }
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [route]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((text: string, action?: NotifyAction) => {
    seq.current += 1;
    setToast({ id: seq.current, text, action });
  }, []);

  const openAdd = useCallback((opts?: { date?: string; meal?: Meal; food?: Food }) => {
    setEditor({ mode: "add", date: opts?.date ?? todayISO(), meal: opts?.meal, food: opts?.food });
  }, []);

  const openEdit = useCallback((entry: Entry) => {
    setEditor({ mode: "edit", entry });
  }, []);

  const go = useCallback((r: Route) => {
    if (window.location.hash === `#/${r}`) {
      setRoute(r);
      window.scrollTo({ top: 0, behavior: "auto" });
    } else {
      window.location.hash = `/${r}`;
    }
  }, []);

  const ui = useMemo(
    () => ({ notify, openAdd, openEdit, diaryDate, setDiaryDate, go }),
    [notify, openAdd, openEdit, diaryDate, go],
  );

  const editorKey = editor
    ? editor.mode === "edit"
      ? `edit-${editor.entry.id}`
      : `add-${editor.date}-${editor.meal ?? ""}-${editor.food?.id ?? ""}`
    : "closed";

  return (
    <UIContext.Provider value={ui}>
      <Shell route={route} onRoute={go}>
        {route === "today" ? <Today /> : null}
        {route === "diary" ? <Diary /> : null}
        {route === "search" ? <Search /> : null}
        {route === "history" ? <History /> : null}
        {route === "stats" ? <Stats /> : null}
        {route === "notes" ? <Notes /> : null}
        {route === "profile" ? <Profile /> : null}
      </Shell>

      <FoodModal
        key={editorKey}
        editor={editor}
        onClose={() => setEditor(null)}
        onNotify={notify}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
      {intro ? <Onboarding onDone={() => setIntro(false)} /> : null}
    </UIContext.Provider>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Root />
    </StoreProvider>
  );
}
