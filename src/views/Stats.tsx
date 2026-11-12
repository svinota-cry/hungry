import { useMemo, useState } from "react";
import { BarsChart, ChartLegend, LineChart, StackedBars } from "../components/Charts";
import { PageHead, Segmented } from "../components/ui";
import { entriesOn, fmt, fmt1, lastNDates, streak, totalsFor } from "../lib/calc";
import { dayNum, monthShortRu, parseISO, weekdayShort } from "../lib/date";
import { useStore } from "../lib/store";

type Period = "7" | "30" | "90";

export function Stats() {
  const { state } = useStore();
  const [period, setPeriod] = useState<Period>("30");
  const n = Number(period);
  const dates = useMemo(() => lastNDates(n), [n]);
  const goal = state.profile.goalKcal || 2000;
  const goalWater = state.profile.goalWater || 2000;

  const days = useMemo(
    () =>
      dates.map((date) => {
        const entries = entriesOn(state.entries, date);
        return {
          date,
          entries,
          totals: totalsFor(entries),
          water: state.days[date]?.water ?? 0,
          weight: state.weights[date],
        };
      }),
    [dates, state.entries, state.days, state.weights],
  );

  const logged = days.filter((d) => d.entries.length > 0);
  const avgKcal = logged.length
    ? logged.reduce((a, d) => a + d.totals.kcal, 0) / logged.length
    : 0;
  const avgWater = (() => {
    const withWater = days.filter((d) => d.water > 0);
    return withWater.length ? withWater.reduce((a, d) => a + d.water, 0) / withWater.length : 0;
  })();
  const overDays = logged.filter((d) => d.totals.kcal > goal).length;
  const totalEntries = logged.reduce((a, d) => a + d.entries.length, 0);
  const weightPoints = days.filter((d) => d.weight);
  const weightDelta =
    weightPoints.length >= 2
      ? (weightPoints[weightPoints.length - 1].weight as number) - (weightPoints[0].weight as number)
      : 0;

  const label = (date: string) => {
    if (n === 7) return weekdayShort(date);
    if (n === 90) return `${dayNum(date)}.${String(parseISO(date).getMonth() + 1).padStart(2, "0")}`;
    return `${dayNum(date)} ${monthShortRu(date)}`;
  };

  const kcalData = days.map((d) => ({
    label: label(d.date),
    value: d.entries.length ? Math.round(d.totals.kcal) : null,
  }));

  const waterData = days.map((d) => ({
    label: label(d.date),
    value: d.water || null,
  }));

  const macroData = days.map((d) => ({
    label: label(d.date),
    parts: [
      { value: d.totals.p, tone: "p" as const },
      { value: d.totals.f, tone: "f" as const },
      { value: d.totals.c, tone: "c" as const },
    ],
  }));

  const weightData = days.map((d) => ({
    label: label(d.date),
    value: d.weight ?? null,
  }));

  const weightMin = weightPoints.length
    ? Math.floor((Math.min(...weightPoints.map((d) => d.weight as number)) - 0.6) * 2) / 2
    : undefined;
  const weightMax = weightPoints.length
    ? Math.ceil((Math.max(...weightPoints.map((d) => d.weight as number)) + 0.6) * 2) / 2
    : undefined;

  const diff = avgKcal - goal;
  const insight = logged.length
    ? diff > 0
      ? `Средний день — ${fmt(avgKcal)} ккал. На ${fmt(diff)} больше цели. Не катастрофа, но паттерн.`
      : `Средний день — ${fmt(avgKcal)} ккал. На ${fmt(-diff)} меньше цели. Организм не спрашивал.`
    : "Нет данных. Статистика не умеет из воздуха.";

  return (
    <div className="view view--stats">
      <PageHead
        index="05"
        kicker="СТАТИСТИКА"
        title={
          <>
            Статистика<span className="pagehead__aside">{n} дней</span>
          </>
        }
        sub={<>Цифры складываются в узор. Узор не обязан быть приговором.</>}
        actions={
          <Segmented
            label="Период статистики"
            value={period}
            onChange={setPeriod}
            options={[
              { value: "7", label: "7 дней" },
              { value: "30", label: "30" },
              { value: "90", label: "90" },
            ]}
          />
        }
      />

      <div className="statgrid">
        <div className="statcard">
          <span className="eyebrow">СРЕДНЕЕ</span>
          <span className="statcard__val num">{logged.length ? fmt(avgKcal) : "—"}</span>
          <span className="statcard__sub">ккал в день</span>
        </div>
        <div className="statcard">
          <span className="eyebrow">ЗАПИСАНО</span>
          <span className="statcard__val num">{logged.length}</span>
          <span className="statcard__sub">из {n} дней</span>
        </div>
        <div className="statcard">
          <span className="eyebrow">СЕРИЯ</span>
          <span className="statcard__val num">{streak(state.entries)}</span>
          <span className="statcard__sub">дней подряд</span>
        </div>
        <div className={`statcard ${overDays > 0 ? "is-over" : ""}`}>
          <span className="eyebrow">ПЕРЕБОР</span>
          <span className="statcard__val num">{overDays}</span>
          <span className="statcard__sub">дней выше цели</span>
        </div>
        <div className="statcard">
          <span className="eyebrow">ВОДА</span>
          <span className="statcard__val num">{fmt(avgWater)}</span>
          <span className="statcard__sub">мл в среднем</span>
        </div>
        <div className="statcard">
          <span className="eyebrow">ВЕС</span>
          <span className="statcard__val num">
            {weightPoints.length >= 2 ? `${weightDelta > 0 ? "+" : ""}${fmt1(weightDelta)}` : "—"}
          </span>
          <span className="statcard__sub">кг за период</span>
        </div>
      </div>

      <p className="stats__insight">
        <span className="stats__insightmark" aria-hidden="true">✕</span>
        {insight} Перебор был в {overDays} из {logged.length || 0} дней. Всего записей: {totalEntries}.
      </p>

      <section className="card chartcard">
        <header className="card__head">
          <div>
            <span className="eyebrow">КАЛОРИИ ПО ДНЯМ</span>
            <h2 className="chartcard__title">Сколько входило</h2>
          </div>
          <span className="mono-dim">цель {fmt(goal)}</span>
        </header>
        <LineChart data={kcalData} goal={goal} avg={avgKcal || undefined} height={250} unit="ккал" />
      </section>

      <div className="chartrow">
        <section className="card chartcard">
          <header className="card__head">
            <div>
              <span className="eyebrow">МАКРОСЫ</span>
              <h2 className="chartcard__title">Из чего состояло</h2>
            </div>
            <ChartLegend
              items={[
                { label: "белки", tone: "p" },
                { label: "жиры", tone: "f" },
                { label: "углеводы", tone: "c" },
              ]}
            />
          </header>
          <StackedBars data={macroData} height={210} />
        </section>

        <section className="card chartcard">
          <header className="card__head">
            <div>
              <span className="eyebrow">ВОДА</span>
              <h2 className="chartcard__title">Сколько пила</h2>
            </div>
            <span className="mono-dim">цель {fmt(goalWater)}</span>
          </header>
          <BarsChart data={waterData} goal={goalWater} height={210} unit="мл" />
        </section>
      </div>

      <section className="card chartcard">
        <header className="card__head">
          <div>
            <span className="eyebrow">ВЕС</span>
            <h2 className="chartcard__title">Кривая, которая не обязана падать</h2>
          </div>
          <span className="mono-dim">{weightPoints.length} измерений</span>
        </header>
        {weightPoints.length >= 2 ? (
          <LineChart
            data={weightData}
            min={weightMin}
            max={weightMax}
            height={220}
            unit="кг"
            tone="bone"
          />
        ) : (
          <div className="chart chart--empty">
            Мало измерений. Вес — не единственное доказательство, что ты существуешь.
          </div>
        )}
      </section>
    </div>
  );
}
