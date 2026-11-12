import { useEffect, useMemo, useState } from "react";
import { searchFoods } from "../data/foods";
import { fmt, fmt1, r1 } from "../lib/calc";
import { todayISO } from "../lib/date";
import { useStore } from "../lib/store";
import type { Entry, Food, Meal } from "../lib/types";
import { MEALS } from "../data/quips";
import { Icon } from "./Icon";
import { Modal, Tag } from "./ui";

export type EditorState =
  | { mode: "add"; date: string; meal?: Meal; food?: Food }
  | { mode: "edit"; entry: Entry };

type Filter = "all" | "safe" | "red" | "mine";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "всё" },
  { id: "safe", label: "безопасные" },
  { id: "red", label: "красные флаги" },
  { id: "mine", label: "мои" },
];

const GRAM_CHIPS = [30, 50, 100, 150, 200, 250, 300];

function inferMeal(): Meal {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 16) return "lunch";
  if (h < 21) return "dinner";
  return "snack";
}

export function FoodModal({
  editor,
  onClose,
  onNotify,
}: {
  editor: EditorState | null;
  onClose: () => void;
  onNotify: (text: string, action?: { label: string; onClick: () => void }) => void;
}) {
  const { foods, addEntry, updateEntry, removeEntry, addCustomFood, restoreEntry } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Food | null>(null);
  const [grams, setGrams] = useState(100);
  const [meal, setMeal] = useState<Meal>("breakfast");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState({ name: "", kcal: "", p: "", f: "", c: "" });
  const [customError, setCustomError] = useState("");

  const isEdit = editor?.mode === "edit";

  useEffect(() => {
    if (!editor) return;
    setQuery("");
    setFilter("all");
    setNote("");
    setCustomOpen(false);
    setCustomError("");
    setCustom({ name: "", kcal: "", p: "", f: "", c: "" });
    if (editor.mode === "edit") {
      const e = editor.entry;
      const k = e.grams > 0 ? 100 / e.grams : 0;
      setSelected({
        id: e.foodId,
        name: e.name,
        kcal: r1(e.kcal * k),
        p: r1(e.p * k),
        f: r1(e.f * k),
        c: r1(e.c * k),
        tags: [],
      });
      setGrams(e.grams);
      setMeal(e.meal);
      setDate(e.date);
      setNote(e.note ?? "");
    } else {
      setSelected(editor.food ?? null);
      setGrams(editor.food?.portion ?? 100);
      setMeal(editor.meal ?? inferMeal());
      setDate(editor.date);
    }
  }, [editor]);

  const list = useMemo(() => {
    let base = foods;
    if (filter === "safe") base = base.filter((f) => f.tags.includes("safe"));
    if (filter === "red") base = base.filter((f) => f.tags.includes("red"));
    if (filter === "mine") base = base.filter((f) => f.custom);
    return searchFoods(base, query).slice(0, 80);
  }, [foods, filter, query]);

  if (!editor) return null;

  const preview = selected ? (selected.kcal * grams) / 100 : 0;
  const valid = !!selected && grams > 0 && grams <= 5000;

  function choose(food: Food) {
    setSelected(food);
    setGrams(food.portion ?? 100);
    setQuery("");
  }

  function submit() {
    if (!selected || !valid) return;
    if (editor?.mode === "edit") {
      updateEntry(editor.entry.id, { grams, meal, date, note: note.trim() || undefined });
      onNotify("Сохранено. Прошлое тоже можно переписать.");
      onClose();
      return;
    }
    addEntry({ date, meal, food: selected, grams, note: note.trim() || undefined });
    onNotify(`Записано: ${selected.name.toLowerCase()}.`);
    onClose();
  }

  function remove() {
    if (editor?.mode !== "edit") return;
    const removed = removeEntry(editor.entry.id);
    onNotify("Удалено. Как будто ничего не было.", removed
      ? { label: "вернуть", onClick: () => restoreEntry(removed) }
      : undefined);
    onClose();
  }

  function createCustom() {
    const name = custom.name.trim();
    const kcal = Number(custom.kcal.replace(",", "."));
    if (!name) {
      setCustomError("У продукта должно быть имя.");
      return;
    }
    if (!Number.isFinite(kcal) || kcal < 0) {
      setCustomError("Калории — числом. Хотя бы приблизительно.");
      return;
    }
    const food = addCustomFood({
      name,
      kcal,
      p: Number(custom.p.replace(",", ".")) || 0,
      f: Number(custom.f.replace(",", ".")) || 0,
      c: Number(custom.c.replace(",", ".")) || 0,
    });
    setSelected(food);
    setGrams(100);
    setCustomOpen(false);
    setCustom({ name: "", kcal: "", p: "", f: "", c: "" });
    setCustomError("");
    onNotify("Свой продукт. Теперь это часть тебя.");
  }

  const title = isEdit ? "Правка записи" : selected ? "Сколько этого было" : "Что ты съел";
  const kicker = isEdit ? "РЕДАКТИРОВАНИЕ" : selected ? "ПОРЦИЯ" : "ПОИСК ПРОДУКТА";

  return (
    <Modal
      open={!!editor}
      onClose={onClose}
      title={title}
      kicker={kicker}
      wide={!selected}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} type="button">
            Отмена
          </button>
          {isEdit ? (
            <button className="btn btn--danger" onClick={remove} type="button">
              <Icon name="trash" size={16} /> Удалить
            </button>
          ) : null}
          <button className="btn btn--pink" onClick={submit} type="button" disabled={!valid}>
            {isEdit ? "Сохранить" : "Записать"} {selected ? `· ${fmt(preview)} ккал` : ""}
          </button>
        </>
      }
    >
      {!selected ? (
        <div className="foodpick">
          <div className="searchbox">
            <Icon name="search" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="молоко, гречка, сожаление..."
              aria-label="Поиск продукта"
              onKeyDown={(e) => {
                if (e.key === "Enter" && list[0]) choose(list[0]);
              }}
            />
            {query ? (
              <button className="searchbox__clear" onClick={() => setQuery("")} aria-label="Очистить">
                <Icon name="close" size={14} />
              </button>
            ) : null}
          </div>

          <div className="chips chips--scroll" role="group" aria-label="Фильтр продуктов">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`chip ${filter === f.id ? "is-active" : ""}`}
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="foodpick__list" role="group" aria-label="Продукты">
            {list.length === 0 ? (
              <div className="foodpick__empty">
                <span className="empty__mark" aria-hidden="true">○</span>
                <p>Пусто. Даже здесь.</p>
                <button className="btn btn--ghost btn--sm" onClick={() => setCustomOpen(true)} type="button">
                  Создать свой продукт
                </button>
              </div>
            ) : (
              list.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  className="foodrow"
                  onClick={() => choose(food)}
                >
                  <span className="foodrow__main">
                    <span className="foodrow__name">{food.name}</span>
                    <span className="foodrow__tags">
                      {food.tags.map((t) => (
                        <Tag key={t} tag={t} />
                      ))}
                      {food.custom ? <span className="tag tag--custom">своё</span> : null}
                    </span>
                  </span>
                  <span className="foodrow__kcal">
                    <b className="num">{fmt(food.kcal)}</b>
                    <span>ккал / 100 г</span>
                  </span>
                  <span className="foodrow__plus" aria-hidden="true">
                    <Icon name="plus" size={16} />
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="foodpick__custom">
            <button
              className="linkbtn"
              type="button"
              onClick={() => setCustomOpen((v) => !v)}
              aria-expanded={customOpen}
            >
              {customOpen ? "— свернуть" : "+ свой продукт"}
            </button>
            {customOpen ? (
              <div className="customfood">
                <label className="field">
                  <span className="field__label">Название</span>
                  <input
                    className="input"
                    value={custom.name}
                    onChange={(e) => setCustom({ ...custom, name: e.target.value })}
                    placeholder="например, бабушкины блины"
                  />
                </label>
                <div className="grid-4">
                  {([
                    ["kcal", "ккал"],
                    ["p", "белки"],
                    ["f", "жиры"],
                    ["c", "углеводы"],
                  ] as const).map(([key, label]) => (
                    <label className="field" key={key}>
                      <span className="field__label">{label} / 100 г</span>
                      <input
                        className="input num"
                        inputMode="decimal"
                        value={custom[key]}
                        onChange={(e) => setCustom({ ...custom, [key]: e.target.value })}
                        placeholder="0"
                      />
                    </label>
                  ))}
                </div>
                {customError ? <p className="formerror">{customError}</p> : null}
                <button className="btn btn--pink btn--sm" type="button" onClick={createCustom}>
                  Добавить в коллекцию
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="portion">
          <div className="portion__food">
            <div>
              <p className="eyebrow">ВЫБРАНО</p>
              <h3 className="portion__name">{selected.name}</h3>
              <p className="portion__per100">
                <span className="num">{fmt1(selected.kcal)}</span> ккал ·{" "}
                <span className="num">{fmt1(selected.p)}</span> б ·{" "}
                <span className="num">{fmt1(selected.f)}</span> ж ·{" "}
                <span className="num">{fmt1(selected.c)}</span> у на 100 г
              </p>
            </div>
            {!isEdit ? (
              <button
                className="linkbtn"
                type="button"
                onClick={() => setSelected(null)}
              >
                заменить
              </button>
            ) : null}
          </div>

          <div className="portion__grams">
            <div className="field">
              <span className="field__label">Граммы</span>
              <div className="stepper">
                <button type="button" onClick={() => setGrams((g) => Math.max(5, g - 10))} aria-label="Минус 10 грамм">
                  <Icon name="minus" size={16} />
                </button>
                <input
                  className="stepper__input num"
                  inputMode="decimal"
                  value={grams}
                  onChange={(e) => {
                    const v = Number(e.target.value.replace(",", "."));
                    setGrams(Number.isFinite(v) ? Math.max(0, Math.min(5000, v)) : 0);
                  }}
                  aria-label="Вес порции в граммах"
                />
                <span className="stepper__unit">г</span>
                <button type="button" onClick={() => setGrams((g) => Math.min(5000, g + 10))} aria-label="Плюс 10 грамм">
                  <Icon name="plus" size={16} />
                </button>
              </div>
            </div>
            <div className="chips">
              {GRAM_CHIPS.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`chip ${grams === g ? "is-active" : ""}`}
                  onClick={() => setGrams(g)}
                >
                  {g} г
                </button>
              ))}
            </div>
          </div>

          <div className="portion__preview">
            <span className="eyebrow">ИТОГО</span>
            <p className="portion__kcal">
              <span className="num">{fmt(preview)}</span>
              <span>ккал</span>
            </p>
            <div className="portion__macros">
              <span><b className="num">{fmt1((selected.p * grams) / 100)}</b> б</span>
              <span><b className="num">{fmt1((selected.f * grams) / 100)}</b> ж</span>
              <span><b className="num">{fmt1((selected.c * grams) / 100)}</b> у</span>
            </div>
          </div>

          <div className="portion__row">
            <div className="field">
              <span className="field__label">Приём пищи</span>
              <div className="chips">
                {MEALS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`chip ${meal === m.id ? "is-active" : ""}`}
                    onClick={() => setMeal(m.id)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="field field--date">
              <span className="field__label">Дата</span>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={todayISO()}
              />
            </label>
          </div>

          <label className="field">
            <span className="field__label">Пометка (необязательно)</span>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="после этого стало легче? хуже? никак?"
              maxLength={120}
            />
          </label>
        </div>
      )}
    </Modal>
  );
}
