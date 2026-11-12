import { useMemo, useState } from "react";
import { MOODS } from "../data/quips";
import { formatDateRu, relativeDay, timeLabel } from "../lib/date";
import { useStore } from "../lib/store";
import { useUI } from "../lib/ui";
import type { Mood } from "../lib/types";
import { Icon } from "../components/Icon";
import { Empty, PageHead } from "../components/ui";

type Filter = "all" | Mood;

export function Notes() {
  const { state, addNote, removeNote } = useStore();
  const { notify } = useUI();
  const [text, setText] = useState("");
  const [mood, setMood] = useState<Mood>("quiet");
  const [filter, setFilter] = useState<Filter>("all");

  const notes = useMemo(() => {
    const sorted = [...state.notes].sort((a, b) => b.createdAt - a.createdAt);
    if (filter === "all") return sorted;
    return sorted.filter((n) => n.mood === filter);
  }, [state.notes, filter]);

  function save() {
    if (!text.trim()) {
      notify("Пустая заметка. Тоже позиция.");
      return;
    }
    addNote(text, mood);
    setText("");
    notify("Записано. Теперь это существует.");
  }

  const moodMeta = (id: Mood) => MOODS.find((m) => m.id === id) ?? MOODS[1];

  return (
    <div className="view view--notes">
      <PageHead
        index="06"
        kicker="ЗАМЕТКИ"
        title={
          <>
            Заметки<span className="pagehead__aside">{state.notes.length}</span>
          </>
        }
        sub={<>То, что не помещается в калории. Пока.</>}
      />

      <section className="card composer">
        <header className="card__head">
          <span className="eyebrow">НАЦАРАПАТЬ</span>
          <span className="mono-dim">{text.length} / 600</span>
        </header>
        <label className="sr-only" htmlFor="note-text">Текст заметки</label>
        <textarea
          id="note-text"
          className="composer__text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 600))}
          placeholder="что происходит? без правильных ответов."
          rows={4}
        />
        <div className="composer__bottom">
          <div className="chips" role="group" aria-label="Настроение">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`chip chip--mood ${mood === m.id ? "is-active" : ""}`}
                data-mood={m.id}
                onClick={() => setMood(m.id)}
                aria-pressed={mood === m.id}
              >
                <span aria-hidden="true">{m.mark}</span> {m.label}
              </button>
            ))}
          </div>
          <button className="btn btn--pink" type="button" onClick={save}>
            <Icon name="edit" size={16} /> Оставить след
          </button>
        </div>
      </section>

      <div className="notesbar">
        <span className="eyebrow">АРХИВ</span>
        <div className="chips chips--scroll" role="group" aria-label="Фильтр заметок">
          <button
            type="button"
            className={`chip ${filter === "all" ? "is-active" : ""}`}
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
          >
            все
          </button>
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`chip chip--mood ${filter === m.id ? "is-active" : ""}`}
              data-mood={m.id}
              onClick={() => setFilter(m.id)}
              aria-pressed={filter === m.id}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {notes.length ? (
        <div className="notegrid">
          {notes.map((note, i) => {
            const meta = moodMeta(note.mood);
            return (
              <article
                className={`notecard card ${i % 3 === 1 ? "notecard--tilt" : ""}`}
                key={note.id}
                data-mood={note.mood}
              >
                <header className="notecard__head">
                  <span className="notecard__mood">
                    <span aria-hidden="true">{meta.mark}</span> {meta.label}
                  </span>
                  <button
                    className="iconbtn iconbtn--sm"
                    type="button"
                    onClick={() => {
                      removeNote(note.id);
                      notify("Заметка удалена. Но ты её помнишь.");
                    }}
                    aria-label="Удалить заметку"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </header>
                <p className="notecard__text">{note.text}</p>
                <footer className="notecard__foot">
                  <span>{relativeDay(note.date)} · {formatDateRu(note.date)}</span>
                  <span className="mono-dim">{timeLabel(note.createdAt)}</span>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty
          mark="□"
          title="Здесь пока тихо."
          sub="Можно ничего не чувствовать. Можно записать и это."
        />
      )}
    </div>
  );
}
