import { useEffect, useState } from "react";
import { useStore } from "../lib/store";
import { Icon } from "./Icon";

export function Onboarding({ onDone }: { onDone: () => void }) {
  const { setProfile, setIntroSeen } = useStore();
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("1900");
  const [water, setWater] = useState("2000");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };
  }, []);

  function enter() {
    const k = Math.max(800, Math.min(6000, Number(kcal.replace(",", ".")) || 1900));
    const w = Math.max(500, Math.min(6000, Number(water.replace(",", ".")) || 2000));
    setProfile({ name: name.trim() || "аноним", goalKcal: k, goalWater: w });
    setIntroSeen(true);
    onDone();
  }

  function skip() {
    setIntroSeen(true);
    onDone();
  }

  return (
    <div className="intro" role="dialog" aria-modal="true" aria-label="Первый вход в HUNGRY">
      <div className="intro__noise" aria-hidden="true" />
      <div className="intro__inner">
        <div className="intro__brand">
          <span className="eyebrow">ПЕРВЫЙ ВХОД / 00</span>
          <h1 className="intro__title" data-text="HUNGRY" aria-label="HUNGRY">
            HUNGRY
          </h1>
          <p className="intro__tag">
            Дневник питания, который <em>не желает тебе добра</em>.
          </p>
        </div>

        <form
          className="intro__form"
          onSubmit={(e) => {
            e.preventDefault();
            enter();
          }}
        >
          <p className="intro__lead">
            Считай еду, воду и вес. Смотри, как цифры складываются в дни.
            Ничего не уходит на сервер — всё остаётся в этом браузере.
          </p>

          <label className="field">
            <span className="field__label">Как тебя называть</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="аноним"
              maxLength={28}
              autoComplete="nickname"
            />
          </label>

          <div className="intro__row">
            <label className="field">
              <span className="field__label">Цель, ккал</span>
              <input
                className="input num"
                inputMode="numeric"
                value={kcal}
                onChange={(e) => setKcal(e.target.value)}
                placeholder="1900"
              />
            </label>
            <label className="field">
              <span className="field__label">Вода, мл</span>
              <input
                className="input num"
                inputMode="numeric"
                value={water}
                onChange={(e) => setWater(e.target.value)}
                placeholder="2000"
              />
            </label>
          </div>

          <button className="btn btn--pink btn--wide" type="submit">
            Войти <Icon name="arrow" size={16} />
          </button>
          <button className="linkbtn intro__skip" type="button" onClick={skip}>
            просто покажи, я потом
          </button>

          <p className="intro__note">
            Внутри уже лежат 4 недели демо-записей. Их можно стереть в профиле.
            Это не медицинский сервис. Если тяжело — поговори с живым человеком.
          </p>
        </form>
      </div>
      <div className="intro__foot" aria-hidden="true">
        <span>ЕШЬ</span><span>✕</span><span>ДЫШИ</span><span>✕</span><span>ПОВТОРЯЙ</span>
      </div>
    </div>
  );
}
