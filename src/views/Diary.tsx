import { MEALS } from "../data/quips";
import { entriesOn, fmt, fmt1, totalsFor } from "../lib/calc";
import { addDays, formatDateFullRu, relativeDay, todayISO, weekdayLong } from "../lib/date";
import { useEntryDelete } from "../lib/hooks";
import { useStore } from "../lib/store";
import { useUI } from "../lib/ui";
import type { Meal } from "../lib/types";
import { Icon } from "../components/Icon";
import { Empty, PageHead } from "../components/ui";

export function Diary() {
  const { state, setWater } = useStore();
  const { openAdd, openEdit, diaryDate, setDiaryDate } = useUI();
  const del = useEntryDelete();
  const date = diaryDate;
  const today = todayISO();
  const entries = entriesOn(state.entries, date);
  const totals = totalsFor(entries);
  const goal = state.profile.goalKcal || 2000;
  const water = state.days[date]?.water ?? 0;

  const grouped = MEALS.map((m) => ({
    ...m,
    items: entries.filter((e) => e.meal === m.id),
    totals: totalsFor(entries.filter((e) => e.meal === m.id)),
  }));

  function move(delta: number) {
    const next = addDays(date, delta);
    if (next > today) return;
    setDiaryDate(next);
  }

  return (
    <div className="view view--diary">
      <PageHead
        index="02"
        kicker="ДНЕВНИК"
        title={
          <>
            Дневник<span className="pagehead__aside">еда как факт</span>
          </>
        }
        sub={<>Каждая запись — след. Даже если не хочется смотреть.</>}
        actions={
          <button className="btn btn--pink" type="button" onClick={() => openAdd({ date })}>
            <Icon name="plus" size={17} /> Добавить
          </button>
        }
      />

      <div className="datenav card">
        <button className="iconbtn" type="button" onClick={() => move(-1)} aria-label="Предыдущий день">
          <Icon name="left" size={18} />
        </button>
        <div className="datenav__center">
          <span className="eyebrow">{weekdayLong(date)}</span>
          <span className="datenav__date">{relativeDay(date)}</span>
          <span className="datenav__full">{formatDateFullRu(date)}</span>
        </div>
        <label className="datenav__pick">
          <span className="sr-only">Выбрать дату</span>
          <Icon name="calendar" size={16} />
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => e.target.value && setDiaryDate(e.target.value)}
          />
        </label>
        <button
          className="iconbtn"
          type="button"
          onClick={() => move(1)}
          aria-label="Следующий день"
          disabled={date >= today}
        >
          <Icon name="right" size={18} />
        </button>
      </div>

      <div className="daysum">
        <div className={`daysum__cell ${totals.kcal > goal ? "is-over" : ""}`}>
          <span className="eyebrow">КАЛОРИИ</span>
          <span className="daysum__val num">{fmt(totals.kcal)}</span>
          <span className="daysum__sub">из {fmt(goal)}</span>
        </div>
        <div className="daysum__cell">
          <span className="eyebrow">МАКРОСЫ</span>
          <span className="daysum__val daysum__val--small num">
            {fmt1(totals.p)} <i>б</i> · {fmt1(totals.f)} <i>ж</i> · {fmt1(totals.c)} <i>у</i>
          </span>
          <span className="daysum__sub">граммы</span>
        </div>
        <div className="daysum__cell">
          <span className="eyebrow">ВОДА</span>
          <span className="daysum__val daysum__val--small num">{fmt(water)} <i>мл</i></span>
          <button
            className="linkbtn"
            type="button"
            onClick={() => setWater(date, water + 250)}
          >
            +250 мл
          </button>
        </div>
        <div className="daysum__cell">
          <span className="eyebrow">ЗАПИСЕЙ</span>
          <span className="daysum__val num">{entries.length}</span>
          <span className="daysum__sub">и ни одной лишней</span>
        </div>
      </div>

      <div className="meals">
        {grouped.map((meal) => (
          <section className={`meal card ${meal.items.length === 0 ? "is-empty" : ""}`} key={meal.id}>
            <header className="meal__head">
              <div className="meal__titlewrap">
                <span className="eyebrow">
                  {meal.short} <span className="mono-dim">· {meal.time}</span>
                </span>
                <h2 className="meal__title">{meal.label}</h2>
              </div>
              <div className="meal__sum">
                <span className="num">{fmt(meal.totals.kcal)}</span>
                <em>ккал</em>
              </div>
              <button
                className="iconbtn"
                type="button"
                onClick={() => openAdd({ date, meal: meal.id as Meal })}
                aria-label={`Добавить в ${meal.label}`}
              >
                <Icon name="plus" size={18} />
              </button>
            </header>

            {meal.items.length ? (
              <ul className="erows">
                {meal.items.map((e, i) => (
                  <li className="erow" key={e.id}>
                    <span className="erow__idx num">{String(i + 1).padStart(2, "0")}</span>
                    <button className="erow__btn" type="button" onClick={() => openEdit(e)}>
                      <span className="erow__name">{e.name}</span>
                      <span className="erow__meta">
                        {fmt(e.grams)} г · {fmt1(e.p)} б / {fmt1(e.f)} ж / {fmt1(e.c)} у
                        {e.note ? <em className="erow__note"> · {e.note}</em> : null}
                      </span>
                    </button>
                    <span className="erow__kcal num">{fmt(e.kcal)}</span>
                    <button
                      className="iconbtn iconbtn--sm"
                      type="button"
                      onClick={() => del(e)}
                      aria-label={`Удалить ${e.name}`}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="meal__empty">Тишина. Может, и хорошо.</p>
            )}
          </section>
        ))}
      </div>

      {entries.length === 0 ? (
        <Empty
          mark="□"
          title="В этот день ничего не записано."
          sub="Либо не ел. Либо не признался."
          action={
            <button className="btn btn--pink btn--sm" type="button" onClick={() => openAdd({ date })}>
              Записать
            </button>
          }
        />
      ) : (
        <button className="addline" type="button" onClick={() => openAdd({ date })}>
          <Icon name="plus" size={18} />
          <span>ДОБАВИТЬ ЕЩЁ</span>
          <span className="addline__hint">это не обязательно должно быть стыдно</span>
        </button>
      )}
    </div>
  );
}
