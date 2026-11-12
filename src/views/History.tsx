import { useMemo, useState } from "react";
import { MEALS } from "../data/quips";
import { entriesOn, fmt, fmt1, totalsFor } from "../lib/calc";
import {
  addDays,
  formatDateFullRu,
  monthMatrix,
  monthTitle,
  parseISO,
  relativeDay,
  todayISO,
  weekdayShort,
} from "../lib/date";
import { useStore } from "../lib/store";
import { useUI } from "../lib/ui";
import { Icon } from "../components/Icon";
import { Empty, PageHead } from "../components/ui";

type Level = "none" | "low" | "mid" | "high" | "over";

const WEEK = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

export function History() {
  const { state } = useStore();
  const { openEdit, go, setDiaryDate } = useUI();
  const today = todayISO();
  const [cursor, setCursor] = useState(() => {
    const d = parseISO(today);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selected, setSelected] = useState(today);

  const goal = state.profile.goalKcal || 2000;
  const matrix = useMemo(() => monthMatrix(cursor.y, cursor.m), [cursor]);

  const byDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of state.entries) map.set(e.date, (map.get(e.date) ?? 0) + e.kcal);
    return map;
  }, [state.entries]);

  function level(date: string): Level {
    const kcal = byDate.get(date) ?? 0;
    if (!kcal) return "none";
    const r = kcal / goal;
    if (r < 0.4) return "low";
    if (r < 0.8) return "mid";
    if (r <= 1) return "high";
    return "over";
  }

  const monthDates = matrix.flat().filter((d) => parseISO(d).getMonth() === cursor.m);
  const logged = monthDates.filter((d) => (byDate.get(d) ?? 0) > 0).length;
  const monthTotal = monthDates.reduce((acc, d) => acc + (byDate.get(d) ?? 0), 0);
  const avg = logged ? monthTotal / logged : 0;

  const entries = entriesOn(state.entries, selected);
  const totals = totalsFor(entries);
  const water = state.days[selected]?.water ?? 0;
  const weight = state.weights[selected];
  const notes = state.notes.filter((n) => n.date === selected);

  const isCurrentMonth =
    cursor.y === Number(today.slice(0, 4)) && cursor.m === Number(today.slice(5, 7)) - 1;

  function shiftMonth(delta: number) {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  }

  return (
    <div className="view view--history">
      <PageHead
        index="04"
        kicker="ИСТОРИЯ"
        title={
          <>
            История<span className="pagehead__aside">хроника</span>
          </>
        }
        sub={<>Всё, что было, осталось здесь. К сожалению и к счастью.</>}
        actions={
          <button className="btn btn--ghost" type="button" onClick={() => { setDiaryDate(selected); go("diary"); }}>
            Открыть день <Icon name="arrow" size={15} />
          </button>
        }
      />

      <div className="history">
        <section className="card heat">
          <header className="heat__head">
            <div>
              <span className="eyebrow">КАЛЕНДАРЬ</span>
              <h2 className="heat__title">{monthTitle(cursor.y, cursor.m)}</h2>
            </div>
            <div className="heat__nav">
              <button className="iconbtn" type="button" onClick={() => shiftMonth(-1)} aria-label="Предыдущий месяц">
                <Icon name="left" size={18} />
              </button>
              <button className="iconbtn" type="button" onClick={() => shiftMonth(1)} aria-label="Следующий месяц" disabled={isCurrentMonth}>
                <Icon name="right" size={18} />
              </button>
            </div>
          </header>

          <div className="heat__months">
            <div className="heat__legend">
              <span>меньше</span>
              <i className="heat__swatch heat__swatch--none" />
              <i className="heat__swatch heat__swatch--low" />
              <i className="heat__swatch heat__swatch--mid" />
              <i className="heat__swatch heat__swatch--high" />
              <i className="heat__swatch heat__swatch--over" />
              <span>больше</span>
            </div>
            <span className="mono-dim">
              {logged} дней · среднее {fmt(avg)} ккал
            </span>
          </div>

          <div className="heat__grid" role="grid" aria-label={`Календарь за ${monthTitle(cursor.y, cursor.m)}`}>
            {WEEK.map((w) => (
              <span className="heat__weekday" key={w}>{w}</span>
            ))}
            {matrix.flat().map((date) => {
              const out = parseISO(date).getMonth() !== cursor.m;
              const lvl = level(date);
              const kcal = byDate.get(date) ?? 0;
              const isToday = date === today;
              const isSelected = date === selected;
              return (
                <button
                  key={date}
                  type="button"
                  className={[
                    "heat__day",
                    `heat__day--${lvl}`,
                    out ? "is-out" : "",
                    isToday ? "is-today" : "",
                    isSelected ? "is-selected" : "",
                  ].join(" ")}
                  onClick={() => setSelected(date)}
                  aria-label={`${formatDateFullRu(date)}: ${kcal ? `${fmt(kcal)} ккал` : "нет записей"}`}
                  aria-pressed={isSelected}
                >
                  <span className="heat__num num">{parseISO(date).getDate()}</span>
                  <span
                    className="heat__meter"
                    style={{ height: kcal ? `${Math.min(100, (kcal / goal) * 100)}%` : 0 }}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </section>

        <section className="card dayview">
          <header className="dayview__head">
            <div>
              <span className="eyebrow">{weekdayShort(selected)} · {relativeDay(selected)}</span>
              <h2 className="dayview__title">{formatDateFullRu(selected)}</h2>
            </div>
            <span className={`dayview__kcal ${totals.kcal > goal ? "is-over" : ""}`}>
              <b className="num">{fmt(totals.kcal)}</b>
              <em>ккал</em>
            </span>
          </header>

          <div className="dayview__meta">
            <span>белки <b className="num">{fmt1(totals.p)}</b></span>
            <span>жиры <b className="num">{fmt1(totals.f)}</b></span>
            <span>углеводы <b className="num">{fmt1(totals.c)}</b></span>
            <span>вода <b className="num">{fmt(water)}</b> мл</span>
            {weight ? <span>вес <b className="num">{fmt1(weight)}</b> кг</span> : null}
          </div>

          {entries.length ? (
            <div className="dayview__meals">
              {MEALS.map((m) => {
                const items = entries.filter((e) => e.meal === m.id);
                if (!items.length) return null;
                return (
                  <div className="dayview__meal" key={m.id}>
                    <span className="eyebrow">{m.short}</span>
                    <ul className="erows">
                      {items.map((e) => (
                        <li className="erow" key={e.id}>
                          <button className="erow__btn" type="button" onClick={() => openEdit(e)}>
                            <span className="erow__name">{e.name}</span>
                            <span className="erow__meta">{fmt(e.grams)} г</span>
                          </button>
                          <span className="erow__kcal num">{fmt(e.kcal)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty mark="○" title="В этот день — пусто." sub="Иногда это лучшая запись." />
          )}

          {notes.length ? (
            <div className="dayview__notes">
              <span className="eyebrow">ЗАМЕТКИ ДНЯ</span>
              {notes.map((n) => (
                <p className="dayview__note" key={n.id} data-mood={n.mood}>{n.text}</p>
              ))}
            </div>
          ) : null}

          <div className="dayview__actions">
            <button className="btn btn--ghost btn--sm" type="button" onClick={() => { setDiaryDate(selected); go("diary"); }}>
              Открыть в дневнике
            </button>
            <button className="btn btn--ghost btn--sm" type="button" onClick={() => setSelected(addDays(selected, -1))}>
              ← предыдущий
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
