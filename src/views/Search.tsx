import { useMemo, useState } from "react";
import { searchFoods } from "../data/foods";
import { fmt, fmt1 } from "../lib/calc";
import { useStore } from "../lib/store";
import { useUI } from "../lib/ui";
import { Icon } from "../components/Icon";
import { Empty, PageHead, Tag } from "../components/ui";

type Filter = "all" | "safe" | "red" | "mine";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "всё" },
  { id: "safe", label: "безопасные" },
  { id: "red", label: "красные флаги" },
  { id: "mine", label: "мои" },
];

export function Search() {
  const { foods, addCustomFood, removeCustomFood } = useStore();
  const { openAdd, notify } = useUI();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", kcal: "", p: "", f: "", c: "" });
  const [error, setError] = useState("");

  const counts = useMemo(
    () => ({
      all: foods.length,
      safe: foods.filter((f) => f.tags.includes("safe")).length,
      red: foods.filter((f) => f.tags.includes("red")).length,
      mine: foods.filter((f) => f.custom).length,
    }),
    [foods],
  );

  const list = useMemo(() => {
    let base = foods;
    if (filter === "safe") base = base.filter((f) => f.tags.includes("safe"));
    if (filter === "red") base = base.filter((f) => f.tags.includes("red"));
    if (filter === "mine") base = base.filter((f) => f.custom);
    return searchFoods(base, query);
  }, [foods, filter, query]);

  function create() {
    const name = form.name.trim();
    const kcal = Number(form.kcal.replace(",", "."));
    if (!name) {
      setError("Имя. У еды должно быть имя.");
      return;
    }
    if (!Number.isFinite(kcal) || kcal < 0) {
      setError("Калории числом. Даже приблизительно.");
      return;
    }
    addCustomFood({
      name,
      kcal,
      p: Number(form.p.replace(",", ".")) || 0,
      f: Number(form.f.replace(",", ".")) || 0,
      c: Number(form.c.replace(",", ".")) || 0,
    });
    setForm({ name: "", kcal: "", p: "", f: "", c: "" });
    setError("");
    setFilter("mine");
    notify("Свой продукт. Теперь он часть системы.");
  }

  return (
    <div className="view view--search">
      <PageHead
        index="03"
        kicker="ПОИСК ПРОДУКТОВ"
        title={
          <>
            Поиск<span className="pagehead__aside">{foods.length} позиций</span>
          </>
        }
        sub={<>Всё уже придумано до тебя. Осталось выбрать и взвесить.</>}
        actions={
          <button className="btn btn--pink" type="button" onClick={() => openAdd()}>
            <Icon name="plus" size={17} /> Записать
          </button>
        }
      />

      <div className="searchhero">
        <div className="searchbox searchbox--big">
          <Icon name="search" size={22} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="что ты ищешь? молоко, гречка, повод..."
            aria-label="Поиск продуктов"
            autoComplete="off"
          />
          {query ? (
            <button className="searchbox__clear" onClick={() => setQuery("")} aria-label="Очистить поиск">
              <Icon name="close" size={16} />
            </button>
          ) : null}
        </div>
        <div className="chips chips--scroll" role="group" aria-label="Фильтры">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`chip ${filter === f.id ? "is-active" : ""}`}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
            >
              {f.label} <span className="chip__count num">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="searchbar">
        <span className="eyebrow">
          НАЙДЕНО <span className="num">{list.length}</span>
        </span>
        <button className="linkbtn" type="button" onClick={() => setFormOpen((v) => !v)} aria-expanded={formOpen}>
          {formOpen ? "— свернуть" : "+ свой продукт"}
        </button>
      </div>

      {formOpen ? (
        <section className="card customfood customfood--wide">
          <header className="card__head">
            <span className="eyebrow">СВОЙ ПРОДУКТ</span>
            <span className="mono-dim">на 100 г</span>
          </header>
          <div className="customfood__grid">
            <label className="field">
              <span className="field__label">Название</span>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="например, мамин суп"
                maxLength={60}
              />
            </label>
            {([
              ["kcal", "ккал"],
              ["p", "белки"],
              ["f", "жиры"],
              ["c", "углеводы"],
            ] as const).map(([key, label]) => (
              <label className="field" key={key}>
                <span className="field__label">{label}</span>
                <input
                  className="input num"
                  inputMode="decimal"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder="0"
                />
              </label>
            ))}
          </div>
          {error ? <p className="formerror">{error}</p> : null}
          <div className="customfood__actions">
            <button className="btn btn--ghost btn--sm" type="button" onClick={() => setFormOpen(false)}>
              Отмена
            </button>
            <button className="btn btn--pink btn--sm" type="button" onClick={create}>
              Добавить
            </button>
          </div>
        </section>
      ) : null}

      {list.length ? (
        <div className="foodgrid">
          {list.slice(0, 60).map((food) => (
            <article className="foodcard card" key={food.id}>
              <div className="foodcard__tags">
                {food.tags.map((t) => <Tag key={t} tag={t} />)}
                {food.custom ? <span className="tag tag--custom">своё</span> : null}
              </div>
              <h2 className="foodcard__name">{food.name}</h2>
              <p className="foodcard__kcal">
                <span className="num">{fmt(food.kcal)}</span>
                <span>ккал / 100 г</span>
              </p>
              <div className="foodcard__macros">
                <span><b className="num">{fmt1(food.p)}</b> б</span>
                <span><b className="num">{fmt1(food.f)}</b> ж</span>
                <span><b className="num">{fmt1(food.c)}</b> у</span>
              </div>
              <div className="foodcard__actions">
                <button className="btn btn--ghost btn--sm" type="button" onClick={() => openAdd({ food })}>
                  <Icon name="plus" size={15} /> Добавить
                </button>
                {food.custom ? (
                  <button
                    className="iconbtn iconbtn--sm"
                    type="button"
                    onClick={() => {
                      removeCustomFood(food.id);
                      notify("Свой продукт удалён. Записи остались.");
                    }}
                    aria-label={`Удалить ${food.name}`}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          mark="○"
          title="Ничего не найдено."
          sub="Мир не обязан содержать то, что ты ищешь. Но можно создать."
          action={
            <button className="btn btn--pink btn--sm" type="button" onClick={() => setFormOpen(true)}>
              Создать свой продукт
            </button>
          }
        />
      )}

      {list.length > 60 ? (
        <p className="searchmore">Показаны первые 60. Уточни запрос — мир станет меньше.</p>
      ) : null}
    </div>
  );
}
