import { useState } from "react";
import { MARQUEE, MEALS, STATUS_LINES, statusLine } from "../data/quips";
import { entriesOn, fmt, fmt1, streak, totalsFor } from "../lib/calc";
import { formatDateRu, relativeDay, timeLabel, todayISO, weekdayLong } from "../lib/date";
import { useEntryDelete } from "../lib/hooks";
import { useStore } from "../lib/store";
import { useUI } from "../lib/ui";
import type { Food } from "../lib/types";
import { Icon } from "../components/Icon";
import { Marquee } from "../components/Marquee";
import { Bar, Empty, PageHead, Ring } from "../components/ui";

export function Today() {
  const { state, foods, setWater, setWeight } = useStore();
  const { openAdd, openEdit, notify } = useUI();
  const del = useEntryDelete();
  const today = todayISO();
  const entries = entriesOn(state.entries, today);
  const totals = totalsFor(entries);
  const goal = state.profile.goalKcal || 2000;
  const ratio = totals.kcal / goal;
  const water = state.days[today]?.water ?? 0;
  const goalWater = state.profile.goalWater || 2000;
  const weightDays = Object.keys(state.weights).sort();
  const lastWeightDay = weightDays[weightDays.length - 1];
  const lastWeight = lastWeightDay ? state.weights[lastWeightDay] : 0;
  const [weightInput, setWeightInput] = useState("");

  const recent = [...entries].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  const frequent = new Map<string, number>();
  for (const e of state.entries.slice(-120)) {
    frequent.set(e.name, (frequent.get(e.name) ?? 0) + 1);
  }
  const quickFoods = [...frequent.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => foods.find((f) => f.name === name))
    .filter((f): f is Food => !!f)
    .slice(0, 5);

  const glasses = 8;
  const glassMl = Math.round(goalWater / glasses / 10) * 10;
  const seed = Number(today.replace(/-/g, "")) + Math.round(totals.kcal);

  const macroGoal = {
    p: (goal * 0.25) / 4,
    f: (goal * 0.3) / 9,
    c: (goal * 0.45) / 4,
  };

  function saveWeight() {
    const v = Number(weightInput.replace(",", "."));
    if (v > 20 && v < 400) {
      setWeight(today, v);
      notify(`Вес записан: ${fmt1(v)} кг. Цифра, не приговор.`);
      setWeightInput("");
    } else {
      notify("Это не похоже на вес. Попробуй ещё раз.");
    }
  }

  return (
    <div className="view view--today">
      <PageHead
        index="01"
        kicker={`СЕГОДНЯ · ${weekdayLong(today).toUpperCase()}`}
        title={
          <>
            Ещё один день<span className="pagehead__aside">{formatDateRu(today)}</span>
          </>
        }
        sub={<>Ты снова здесь. Это уже что-то.</>}
        actions={
          <button className="btn btn--pink" onClick={() => openAdd()} type="button">
            <Icon name="plus" size={17} /> Добавить еду
          </button>
        }
      />

      <div className="today__top">
        <section className={`hero card ${ratio > 1 ? "is-over" : ""}`}>
          <div className="hero__top">
            <span className="eyebrow">ПОТРЕБЛЕНО</span>
            <span className="stamp">жив</span>
          </div>
          <div className="hero__main">
            <div className="hero__numwrap">
              <p className="hero__kcal">
                <span className="num">{fmt(totals.kcal)}</span>
              </p>
              <p className="hero__goal">
                из <span className="num">{fmt(goal)}</span> ккал
              </p>
              <Bar value={totals.kcal} max={goal} height={10} label="Калории за день" />
              <p className={`hero__delta ${ratio > 1 ? "is-over" : ""}`}>
                {ratio > 1 ? (
                  <>перебор <span className="num">+{fmt(totals.kcal - goal)}</span></>
                ) : (
                  <>осталось <span className="num">{fmt(Math.max(0, goal - totals.kcal))}</span></>
                )}
              </p>
            </div>
            <Ring value={ratio} size={152} stroke={7} label={`${Math.round(ratio * 100)}% от цели`}>
              <span className="ring__pct num">{Math.round(ratio * 100)}<em>%</em></span>
              <span className="ring__cap">от цели</span>
            </Ring>
          </div>
          <p className="hero__line">«{statusLine(ratio)}»</p>
          <div className="hero__ghost" aria-hidden="true">HUNGRY</div>
        </section>

        <div className="today__side">
          <section className="card watercard">
            <header className="card__head">
              <span className="eyebrow">ВОДА</span>
              <Icon name="droplet" size={18} />
            </header>
            <p className="watercard__num">
              <span className="num">{fmt(water)}</span>
              <span className="watercard__goal">/ {fmt(goalWater)} мл</span>
            </p>
            <div className="glasses" role="group" aria-label="Отметить воду">
              {Array.from({ length: glasses }).map((_, i) => {
                const filled = water >= (i + 1) * glassMl;
                return (
                  <button
                    key={i}
                    type="button"
                    className={`glass ${filled ? "is-full" : ""}`}
                    onClick={() => setWater(today, (i + 1) * glassMl)}
                    aria-label={`${(i + 1) * glassMl} мл`}
                    aria-pressed={filled}
                  >
                    <span className="glass__fill" />
                  </button>
                );
              })}
            </div>
            <div className="watercard__actions">
              <button className="btn btn--ghost btn--sm" onClick={() => setWater(today, water + 200)} type="button">
                +200
              </button>
              <button className="btn btn--ghost btn--sm" onClick={() => setWater(today, water + 250)} type="button">
                +250
              </button>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => setWater(today, Math.max(0, water - 200))}
                type="button"
                aria-label="Убрать 200 мл"
              >
                −200
              </button>
            </div>
            <p className="watercard__note">
              {water >= goalWater
                ? "Норма. Тело молчит. Это комплимент."
                : `Ещё ${fmt(Math.max(0, goalWater - water))} мл до нормы.`}
            </p>
          </section>

          <section className="card vitals">
            <header className="card__head">
              <span className="eyebrow">ПУЛЬС</span>
              <span className="mono-dim">{relativeDay(today)}</span>
            </header>
            <div className="vitals__row">
              <div className="vitals__item">
                <span className="vitals__label">серия</span>
                <span className="vitals__val num">{streak(state.entries)}<em>дн</em></span>
              </div>
              <div className="vitals__item">
                <span className="vitals__label">вес</span>
                <span className="vitals__val num">
                  {lastWeight ? fmt1(lastWeight) : "—"}
                  <em>кг</em>
                </span>
              </div>
              <div className="vitals__item">
                <span className="vitals__label">записей</span>
                <span className="vitals__val num">{state.entries.length}</span>
              </div>
            </div>
            <form
              className="weightquick"
              onSubmit={(e) => {
                e.preventDefault();
                saveWeight();
              }}
            >
              <label className="sr-only" htmlFor="weight-quick">Записать вес</label>
              <input
                id="weight-quick"
                className="input input--sm num"
                inputMode="decimal"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder={lastWeight ? fmt1(lastWeight) : "кг"}
              />
              <button className="btn btn--ghost btn--sm" type="submit">записать</button>
            </form>
          </section>
        </div>
      </div>

      <div className="today__mid">
        <section className="card macros">
          <header className="card__head">
            <span className="eyebrow">МАКРОСЫ</span>
            <span className="mono-dim">Б / Ж / У · {fmt(totals.kcal)} ккал</span>
          </header>
          <div className="macros__grid">
            {([
              { key: "p", label: "белки", value: totals.p, target: macroGoal.p, tone: "pink" },
              { key: "f", label: "жиры", value: totals.f, target: macroGoal.f, tone: "cherry" },
              { key: "c", label: "углеводы", value: totals.c, target: macroGoal.c, tone: "bone" },
            ] as const).map((m) => (
              <div className="macro" key={m.key}>
                <div className="macro__top">
                  <span className="macro__label">{m.label}</span>
                  <span className="macro__val">
                    <b className="num">{fmt1(m.value)}</b>
                    <span> / {fmt(m.target)} г</span>
                  </span>
                </div>
                <Bar value={m.value} max={m.target} tone={m.tone} height={7} label={`${m.label}: ${fmt1(m.value)} из ${fmt(m.target)} г`} />
              </div>
            ))}
          </div>
          <p className="macros__note">Цели по макросам условные: 25 / 30 / 45 от калорий. Не истина.</p>
        </section>

        <section className="card quick">
          <header className="card__head">
            <span className="eyebrow">БЫСТРО</span>
            <span className="mono-dim">частое</span>
          </header>
          {quickFoods.length ? (
            <div className="quick__chips">
              {quickFoods.map((f) => (
                <button
                  key={f.id}
                  className="quickchip"
                  type="button"
                  onClick={() => openAdd({ food: f })}
                >
                  <span>{f.name}</span>
                  <b className="num">{fmt(f.kcal)}</b>
                </button>
              ))}
            </div>
          ) : (
            <p className="quick__empty">Здесь появятся продукты, которые ты ешь чаще всего. Пока — тишина.</p>
          )}
          <button className="btn btn--ghost btn--wide btn--sm" type="button" onClick={() => openAdd()}>
            <Icon name="search" size={16} /> Найти что-нибудь
          </button>
        </section>
      </div>

      <section className="card recent">
        <header className="card__head">
          <span className="eyebrow">ПОСЛЕДНИЕ ГРЕХИ</span>
          <button className="linkbtn" type="button" onClick={() => openAdd()}>
            + ещё
          </button>
        </header>
        {recent.length ? (
          <ol className="erows">
            {recent.map((e, i) => (
              <li className="erow" key={e.id}>
                <span className="erow__idx num">{String(i + 1).padStart(2, "0")}</span>
                <button className="erow__btn" type="button" onClick={() => openEdit(e)}>
                  <span className="erow__name">{e.name}</span>
                  <span className="erow__meta">
                    {MEALS.find((m) => m.id === e.meal)?.label} · {fmt(e.grams)} г · {timeLabel(e.createdAt)}
                  </span>
                </button>
                <span className="erow__kcal num">{fmt(e.kcal)}</span>
                <button className="iconbtn iconbtn--sm" type="button" onClick={() => del(e)} aria-label={`Удалить ${e.name}`}>
                  <Icon name="trash" size={15} />
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <Empty
            mark="○"
            title="Пока ничего."
            sub="День только начался. Или уже закончился. Неважно."
            action={
              <button className="btn btn--pink btn--sm" type="button" onClick={() => openAdd()}>
                Записать первое
              </button>
            }
          />
        )}
      </section>

      <Marquee items={MARQUEE} />
      <p className="today__line">{STATUS_LINES[seed % STATUS_LINES.length]}</p>
    </div>
  );
}
