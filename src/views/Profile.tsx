import { useRef, useState } from "react";
import { daysLogged, fmt1 } from "../lib/calc";
import { dateISO, formatDateFullRu, relativeDay, todayISO } from "../lib/date";
import { useStore } from "../lib/store";
import { useUI } from "../lib/ui";
import { Icon } from "../components/Icon";
import { PageHead, Switch } from "../components/ui";

export function Profile() {
  const {
    state, setProfile, setWeight, setSettings, resetAll, loadDemo, exportJson, importJson,
  } = useStore();
  const { notify } = useUI();
  const today = todayISO();
  const p = state.profile;

  const [form, setForm] = useState({
    name: p.name,
    goalKcal: String(p.goalKcal),
    goalWater: String(p.goalWater),
    height: String(p.height || ""),
    startWeight: p.startWeight ? String(p.startWeight) : "",
    goalWeight: p.goalWeight ? String(p.goalWeight) : "",
  });
  const [wDate, setWDate] = useState(today);
  const [wVal, setWVal] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const weightDays = Object.keys(state.weights).sort().reverse().slice(0, 6);
  const dataKb = Math.max(1, Math.round(JSON.stringify(state).length / 1024));

  function saveProfile() {
    const kcal = Number(form.goalKcal.replace(",", "."));
    const water = Number(form.goalWater.replace(",", "."));
    const height = Number(form.height.replace(",", "."));
    setProfile({
      name: form.name.trim() || "аноним",
      goalKcal: Number.isFinite(kcal) && kcal >= 800 ? Math.min(6000, kcal) : p.goalKcal,
      goalWater: Number.isFinite(water) && water >= 300 ? Math.min(6000, water) : p.goalWater,
      height: Number.isFinite(height) && height > 50 ? Math.min(260, height) : p.height,
      startWeight: Number(form.startWeight.replace(",", ".")) || 0,
      goalWeight: Number(form.goalWeight.replace(",", ".")) || 0,
    });
    notify("Профиль обновлён. Цифры согласны.");
  }

  function saveWeight() {
    const v = Number(wVal.replace(",", "."));
    if (!v || v < 20 || v > 400) {
      notify("Это не похоже на вес. Попробуй ещё раз.");
      return;
    }
    setWeight(wDate, v);
    setWVal("");
    notify(`Вес за ${relativeDay(wDate)}: ${fmt1(v)} кг.`);
  }

  function doExport() {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hungry-${today}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify("Данные выгружены. Теперь они у тебя.");
  }

  async function doImport(file: File) {
    const text = await file.text();
    if (importJson(text)) notify("Данные загружены. Добро пожаловать обратно.");
    else notify("Файл не подошёл. Это не твоя жизнь.");
  }

  function doReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      window.setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    resetAll();
    setConfirmReset(false);
    notify("Стёрто. Чистый лист. Почти.");
  }

  return (
    <div className="view view--profile">
      <PageHead
        index="07"
        kicker="ПРОФИЛЬ"
        title={
          <>
            Профиль<span className="pagehead__aside">{p.name || "аноним"}</span>
          </>
        }
        sub={<>Настройки, цели и данные. Всё, что можно измерить. Не всё, что важно.</>}
        actions={
          <button className="btn btn--pink" type="button" onClick={saveProfile}>
            <Icon name="check" size={16} /> Сохранить
          </button>
        }
      />

      <div className="profile">
        <section className="card profile__id">
          <div className="profile__avatar" aria-hidden="true">
            {(p.name || "а").slice(0, 1).toUpperCase()}
          </div>
          <div className="profile__idtext">
            <span className="eyebrow">С НАМИ С {formatDateFullRu(dateISO(new Date(p.createdAt)))}</span>
            <h2 className="profile__name">{p.name || "аноним"}</h2>
            <p className="profile__since">
              {daysLogged(state.entries)} дней с записями · {state.entries.length} записей · {state.notes.length} заметок
            </p>
          </div>
          <div className="profile__marks" aria-hidden="true">
            <span>01</span><span>07</span><span>✕</span>
          </div>
        </section>

        <section className="card">
          <header className="card__head">
            <span className="eyebrow">КТО ТЫ</span>
            <span className="mono-dim">можно соврать</span>
          </header>
          <div className="formgrid">
            <label className="field">
              <span className="field__label">Имя</span>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="аноним"
                maxLength={28}
              />
            </label>
            <label className="field">
              <span className="field__label">Рост, см</span>
              <input
                className="input num"
                inputMode="decimal"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                placeholder="170"
              />
            </label>
          </div>
        </section>

        <section className="card">
          <header className="card__head">
            <span className="eyebrow">ЦЕЛИ</span>
            <span className="mono-dim">не приговор</span>
          </header>
          <div className="formgrid">
            <label className="field">
              <span className="field__label">Калории в день</span>
              <input
                className="input num"
                inputMode="numeric"
                value={form.goalKcal}
                onChange={(e) => setForm({ ...form, goalKcal: e.target.value })}
                placeholder="1900"
              />
            </label>
            <label className="field">
              <span className="field__label">Вода, мл</span>
              <input
                className="input num"
                inputMode="numeric"
                value={form.goalWater}
                onChange={(e) => setForm({ ...form, goalWater: e.target.value })}
                placeholder="2000"
              />
            </label>
            <label className="field">
              <span className="field__label">Стартовый вес, кг</span>
              <input
                className="input num"
                inputMode="decimal"
                value={form.startWeight}
                onChange={(e) => setForm({ ...form, startWeight: e.target.value })}
                placeholder="—"
              />
            </label>
            <label className="field">
              <span className="field__label">Целевой вес, кг</span>
              <input
                className="input num"
                inputMode="decimal"
                value={form.goalWeight}
                onChange={(e) => setForm({ ...form, goalWeight: e.target.value })}
                placeholder="—"
              />
            </label>
          </div>
          <p className="formnote">
            Калории — не моральный закон. Если цифра вызывает панику, скрой её кнопкой глаза.
          </p>
        </section>

        <section className="card">
          <header className="card__head">
            <span className="eyebrow">ВЕС</span>
            <span className="mono-dim">цифра, не приговор</span>
          </header>
          <div className="weightlog">
            <label className="field">
              <span className="field__label">Дата</span>
              <input
                type="date"
                className="input"
                value={wDate}
                max={today}
                onChange={(e) => setWDate(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">Вес, кг</span>
              <input
                className="input num"
                inputMode="decimal"
                value={wVal}
                onChange={(e) => setWVal(e.target.value)}
                placeholder="66,4"
              />
            </label>
            <button className="btn btn--ghost" type="button" onClick={saveWeight}>
              Записать
            </button>
          </div>
          {weightDays.length ? (
            <ul className="weightlist">
              {weightDays.map((d) => (
                <li key={d}>
                  <span>{relativeDay(d)} · {formatDateFullRu(d)}</span>
                  <b className="num">{fmt1(state.weights[d])} кг</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="formnote">Пока ни одного измерения. Тело существует и без числа.</p>
          )}
        </section>

        <section className="card">
          <header className="card__head">
            <span className="eyebrow">НАСТРОЙКИ</span>
            <span className="mono-dim">тише / громче</span>
          </header>
          <div className="switchlist">
            <Switch
              checked={state.settings.hideNumbers}
              onChange={(v) => setSettings({ hideNumbers: v })}
              label="Скрывать цифры"
              hint="Калории размываются. Наведи или нажми, чтобы увидеть."
            />
            <Switch
              checked={state.settings.reduceMotion}
              onChange={(v) => setSettings({ reduceMotion: v })}
              label="Меньше движения"
              hint="Отключает глитч, бегущую строку и пульсации."
            />
            <Switch
              checked={state.settings.compact}
              onChange={(v) => setSettings({ compact: v })}
              label="Плотный режим"
              hint="Меньше воздуха. Больше цифр на экране."
            />
          </div>
        </section>

        <section className="card">
          <header className="card__head">
            <span className="eyebrow">ДАННЫЕ</span>
            <span className="mono-dim">{dataKb} КБ в браузере</span>
          </header>
          <div className="databtns">
            <button className="btn btn--ghost btn--sm" type="button" onClick={doExport}>
              <Icon name="download" size={15} /> Выгрузить JSON
            </button>
            <button className="btn btn--ghost btn--sm" type="button" onClick={() => fileRef.current?.click()}>
              <Icon name="upload" size={15} /> Загрузить JSON
            </button>
            <button className="btn btn--ghost btn--sm" type="button" onClick={() => { loadDemo(); notify("Демо-данные загружены. Чужая жизнь на 4 недели."); }}>
              Демо-данные
            </button>
            <button
              className={`btn btn--sm ${confirmReset ? "btn--danger" : "btn--ghost"}`}
              type="button"
              onClick={doReset}
            >
              <Icon name="trash" size={15} /> {confirmReset ? "Точно стереть?" : "Стереть всё"}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Загрузить JSON с данными"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void doImport(file);
              e.target.value = "";
            }}
          />
          <p className="formnote">
            Всё хранится локально в этом браузере. Никакого сервера, аккаунта и облака.
            Очистишь данные браузера — исчезнет всё.
          </p>
        </section>

        <section className="card disclaimer">
          <span className="eyebrow">ВАЖНО</span>
          <p className="disclaimer__text">
            HUNGRY — не медицинский сервис и не диета. Это дневник. Если еда, вес или цифры
            перестали быть просто цифрами, поговори с живым человеком: близким, врачом,
            психологом. Ты не обязан проходить это в одиночку.
          </p>
          <p className="disclaimer__meta">
            HUNGRY v0.2 · сделано из чёрного, вишни и розового · без бэкенда
          </p>
        </section>
      </div>
    </div>
  );
}
