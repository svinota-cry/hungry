import { useState, type ReactNode } from "react";
import { useStore } from "../lib/store";
import { MOBILE_ROUTES, ROUTES, routeMeta, type Route } from "../lib/routes";
import { formatDateRu, todayISO, weekdayShort } from "../lib/date";
import { Icon } from "./Icon";

export function Shell({
  route,
  onRoute,
  children,
}: {
  route: Route;
  onRoute: (r: Route) => void;
  children: ReactNode;
}) {
  const { state, setSettings } = useStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const meta = routeMeta(route);
  const today = todayISO();
  const extraRoutes = ROUTES.filter((r) => !MOBILE_ROUTES.includes(r.id) && r.id !== "profile");

  function go(r: Route) {
    onRoute(r);
    setMoreOpen(false);
  }

  return (
    <div className="app">
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        К содержимому
      </a>

      <aside className="rail" aria-label="Навигация">
        <a className="rail__logo" href="#/today" onClick={(e) => { e.preventDefault(); go("today"); }} aria-label="HUNGRY — сегодня">
          <span className="rail__mark">H<span>/</span></span>
        </a>

        <nav className="rail__nav">
          {ROUTES.map((r) => (
            <a
              key={r.id}
              href={`#/${r.id}`}
              className={`rail__link ${route === r.id ? "is-active" : ""}`}
              onClick={(e) => { e.preventDefault(); go(r.id); }}
              aria-current={route === r.id ? "page" : undefined}
            >
              <span className="rail__idx">{r.index}</span>
              <Icon name={r.icon} size={21} />
              <span className="rail__label">{r.label}</span>
            </a>
          ))}
        </nav>

        <div className="rail__foot">
          <button
            className="rail__eye"
            onClick={() => setSettings({ hideNumbers: !state.settings.hideNumbers })}
            aria-pressed={state.settings.hideNumbers}
            aria-label={state.settings.hideNumbers ? "Показать цифры" : "Скрыть цифры"}
            title={state.settings.hideNumbers ? "Показать цифры" : "Скрыть цифры"}
          >
            <Icon name={state.settings.hideNumbers ? "eyeOff" : "eye"} size={18} />
          </button>
          <span className="rail__version">V.02</span>
          <span className="rail__dot" aria-hidden="true" />
        </div>
      </aside>

      <header className="topbar">
        <a className="topbar__logo" href="#/today" onClick={(e) => { e.preventDefault(); go("today"); }}>
          HUNGRY<span>/</span>
        </a>
        <span className="topbar__meta">
          {weekdayShort(today)} · {formatDateRu(today)}
        </span>
        <button
          className="iconbtn"
          onClick={() => setSettings({ hideNumbers: !state.settings.hideNumbers })}
          aria-pressed={state.settings.hideNumbers}
          aria-label={state.settings.hideNumbers ? "Показать цифры" : "Скрыть цифры"}
        >
          <Icon name={state.settings.hideNumbers ? "eyeOff" : "eye"} size={19} />
        </button>
      </header>

      <div className="main" id="main" tabIndex={-1}>
        <div className="main__inner" key={route}>
          {children}
        </div>
        <footer className="footnote">
          <span className="footnote__mark" aria-hidden="true">✕</span>
          HUNGRY — не медицинский сервис. Если еда перестала быть едой, поговори с живым человеком.
          <span className="footnote__meta">{meta.index} / 07</span>
        </footer>
      </div>

      <nav className="bottomnav" aria-label="Основная навигация">
        {MOBILE_ROUTES.map((id) => {
          const r = routeMeta(id);
          return (
            <a
              key={id}
              href={`#/${id}`}
              className={`bottomnav__link ${route === id ? "is-active" : ""}`}
              onClick={(e) => { e.preventDefault(); go(id); }}
              aria-current={route === id ? "page" : undefined}
            >
              <Icon name={r.icon} size={20} />
              <span>{r.label}</span>
            </a>
          );
        })}
        <button
          className={`bottomnav__link ${moreOpen ? "is-active" : ""}`}
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          aria-controls="more-sheet"
        >
          <Icon name="more" size={20} />
          <span>ещё</span>
        </button>
      </nav>

      {moreOpen ? (
        <div className="sheet" id="more-sheet" role="dialog" aria-modal="true" aria-label="Ещё разделы">
          <div className="sheet__top">
            <span className="eyebrow">ЕЩЁ / 04—07</span>
            <button className="iconbtn" onClick={() => setMoreOpen(false)} aria-label="Закрыть меню">
              <Icon name="close" size={20} />
            </button>
          </div>
          <nav className="sheet__nav">
            {[...extraRoutes, routeMeta("profile")].map((r) => (
              <a
                key={r.id}
                href={`#/${r.id}`}
                className={`sheet__link ${route === r.id ? "is-active" : ""}`}
                onClick={(e) => { e.preventDefault(); go(r.id); }}
              >
                <span className="sheet__num">{r.index}</span>
                <span className="sheet__label">{r.title}</span>
                <Icon name={r.icon} size={20} />
              </a>
            ))}
          </nav>
          <p className="sheet__note">
            Данные живут в этом браузере. Никуда не отправляются. Как и ты.
          </p>
        </div>
      ) : null}
    </div>
  );
}
