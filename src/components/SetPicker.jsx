import { useState } from "react";
import Sheet from "./Sheet.jsx";
import { SETS, PHRASES, setTotal, findSet } from "../data/dhikr.js";
import { setCounter, setCustom } from "../lib/store.js";
import { CheckIcon, PlusIcon } from "./Icons.jsx";

/* Выбор набора. Смена набора обнуляет счёт и круги — как с настоящими
   чётками: взял другой зикр, начал заново. Хранить по счётчику на каждый
   набор соблазнительно, но тогда человек не понимает, откуда взялась
   цифра, когда вернулся к тасбиху через неделю. */
export default function SetPicker({ state, onClose }) {
  const [editing, setEditing] = useState(false);
  const current = state.counter.setId;
  const custom = state.custom;

  const pick = (id) => {
    setCounter({ setId: id, step: 0, count: 0, laps: 0 });
    onClose();
  };

  if (editing) return <CustomEditor state={state} onClose={() => setEditing(false)} onSaved={pick} />;

  return (
    <Sheet title="Зикр" onClose={onClose}>
      <div className="rows">
        {SETS.map((set) => (
          <button className="row" key={set.id} onClick={() => pick(set.id)}>
            <span className="grow">
              <span className="name">{set.name}</span>
              <span className="hint">
                {set.steps.map((s) => `${PHRASES[s.phrase].tr} ×${s.target}`).join(" · ")}
              </span>
            </span>
            {current === set.id ? (
              <span className="tick" data-on="true">
                <CheckIcon />
              </span>
            ) : (
              <span className="val">{setTotal(set)}</span>
            )}
          </button>
        ))}
      </div>

      <div className="sectitle">Свой зикр</div>
      <div className="rows">
        {custom && (
          <button className="row" onClick={() => pick(custom.id)}>
            <span className="grow">
              <span className="name">{custom.name}</span>
              <span className="hint">
                {custom.steps[0].tr || custom.steps[0].ar || "без подписи"} ×{custom.steps[0].target}
              </span>
            </span>
            {current === custom.id ? (
              <span className="tick" data-on="true">
                <CheckIcon />
              </span>
            ) : (
              <span className="val">{setTotal(custom)}</span>
            )}
          </button>
        )}
        <button className="row" onClick={() => setEditing(true)}>
          <PlusIcon style={{ color: "var(--jade)", flex: "none" }} />
          <span className="grow">
            <span className="name">{custom ? "Изменить свой зикр" : "Создать свой зикр"}</span>
            <span className="hint">Любая фраза и любая цель</span>
          </span>
        </button>
      </div>

      <div className="note">
        Круг закрывается, когда пройдены все шаги набора. У тасбиха после намаза их три:
        33, 33 и 34 — счётчик сам переходит с одной фразы на следующую.
      </div>
    </Sheet>
  );
}

function CustomEditor({ state, onClose, onSaved }) {
  const existing = state.custom;
  const [name, setName] = useState(existing?.name || "");
  const [ar, setAr] = useState(existing?.steps[0].ar || "");
  const [tr, setTr] = useState(existing?.steps[0].tr || "");
  const [ru, setRu] = useState(existing?.steps[0].ru || "");
  const [target, setTarget] = useState(existing?.steps[0].target || 100);

  const save = () => {
    const set = {
      id: "custom",
      name: name.trim() || "Свой зикр",
      note: "Свой набор",
      steps: [{ ar: ar.trim(), tr: tr.trim(), ru: ru.trim(), target: Math.max(1, Math.min(9999, +target || 1)) }],
    };
    setCustom(set);
    onClose();
    onSaved("custom");
  };

  return (
    <Sheet title="Свой зикр" onClose={onClose}>
      <div style={{ display: "grid", gap: 10, paddingTop: 4 }}>
        <input className="field" placeholder="Название набора" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          className="field"
          placeholder="Арабский текст (необязательно)"
          value={ar}
          onChange={(e) => setAr(e.target.value)}
          dir="rtl"
          style={{ fontFamily: "Amiri, serif", fontSize: 20 }}
        />
        <input className="field" placeholder="Транслитерация" value={tr} onChange={(e) => setTr(e.target.value)} />
        <input className="field" placeholder="Перевод (необязательно)" value={ru} onChange={(e) => setRu(e.target.value)} />

        <div className="sectitle" style={{ margin: "8px 4px 2px" }}>Цель круга</div>
        <div className="chips">
          {[7, 10, 33, 70, 100, 300, 1000].map((n) => (
            <button key={n} className="chip" data-on={+target === n} onClick={() => setTarget(n)}>
              {n}
            </button>
          ))}
        </div>
        <input
          className="field"
          type="number"
          inputMode="numeric"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />

        <button className="bigbtn" onClick={save} style={{ marginTop: 6 }}>
          Сохранить и выбрать
        </button>
        {existing && (
          <button
            className="bigbtn"
            data-danger="true"
            onClick={() => {
              setCustom(null);
              if (state.counter.setId === "custom") setCounter({ setId: SETS[0].id, step: 0, count: 0, laps: 0 });
              onClose();
            }}
          >
            Удалить свой зикр
          </button>
        )}
      </div>
    </Sheet>
  );
}
