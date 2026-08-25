import { useState } from "react";
import Sheet from "./Sheet.jsx";
import { METHODS, HIGH_LAT } from "../lib/prayer-times.mjs";
import { setSetting, resetAll } from "../lib/store.js";
import { haptic } from "../lib/feedback.js";
import { ChevronIcon, ShareIcon, CheckIcon } from "./Icons.jsx";

function Toggle({ label, hint, on, onChange }) {
  return (
    <button
      className="row"
      onClick={() => {
        onChange(!on);
        haptic("soft");
      }}
    >
      <span className="grow">
        <span className="name">{label}</span>
        {hint && <span className="hint">{hint}</span>}
      </span>
      <span className="switch" data-on={on} />
    </button>
  );
}

function Chips({ options, value, onChange }) {
  return (
    <div className="chips" style={{ padding: "2px 2px 0" }}>
      {options.map((o) => (
        <button key={o.value} className="chip" data-on={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function Settings({ state, onClose, onPickPlace }) {
  const s = state.settings;
  const [confirmReset, setConfirmReset] = useState(false);
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

  return (
    <Sheet title="Настройки" onClose={onClose}>
      <div className="sectitle">Отклик</div>
      <div className="rows">
        <Toggle
          label="Вибрация"
          hint="Короткий отклик на каждое произнесение"
          on={s.haptics}
          onChange={(v) => setSetting("haptics", v)}
        />
        <Toggle label="Звук" hint="Тихий щелчок и аккорд на закрытии круга" on={s.sound} onChange={(v) => setSetting("sound", v)} />
        <Toggle
          label="Не гасить экран"
          hint="Пока открыт счётчик"
          on={s.keepAwake}
          onChange={(v) => setSetting("keepAwake", v)}
        />
      </div>

      <div className="sectitle">Вид</div>
      <Chips
        value={s.theme}
        onChange={(v) => setSetting("theme", v)}
        options={[
          { value: "system", label: "Как в системе" },
          { value: "dark", label: "Тёмная" },
          { value: "light", label: "Светлая" },
        ]}
      />

      <div className="sectitle">Дневная цель</div>
      <Chips
        value={s.dailyGoal}
        onChange={(v) => setSetting("dailyGoal", v)}
        options={[100, 300, 500, 1000, 3000].map((n) => ({ value: n, label: String(n) }))}
      />

      <div className="sectitle">Намаз</div>
      <div className="rows">
        <button className="row" onClick={onPickPlace}>
          <span className="grow">
            <span className="name">Место</span>
            <span className="hint">{state.place ? state.place.name : "не выбрано"}</span>
          </span>
          <ChevronIcon style={{ color: "var(--ink-3)", width: 18, height: 18, flex: "none" }} />
        </button>
      </div>

      <div className="sectitle" style={{ marginTop: 16 }}>Метод расчёта</div>
      <div className="rows">
        {Object.entries(METHODS).map(([id, m]) => (
          <button className="row" key={id} onClick={() => setSetting("method", id)}>
            <span className="grow">
              <span className="name">{m.name}</span>
              <span className="hint">
                фаджр {m.fajr}°, иша {m.ishaMinutes ? `${m.ishaMinutes} мин после магриба` : `${m.isha}°`}
              </span>
            </span>
            {/* Галочка, а не переключатель: метод выбирается один из списка,
                а тумблер обещал бы независимое включение каждого */}
            {s.method === id && (
              <span className="tick" data-on="true">
                <CheckIcon />
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="sectitle">Аср</div>
      <Chips
        value={s.asrFactor}
        onChange={(v) => setSetting("asrFactor", v)}
        options={[
          { value: 1, label: "Тень ×1 — большинство" },
          { value: 2, label: "Тень ×2 — ханафитский" },
        ]}
      />

      <div className="sectitle">Высокие широты</div>
      <Chips
        value={s.highLat}
        onChange={(v) => setSetting("highLat", v)}
        options={Object.entries(HIGH_LAT).map(([id, h]) => ({ value: id, label: h.name }))}
      />
      <div className="note">
        Летом севернее Москвы солнце не заходит достаточно глубоко, и астрономических
        фаджра с ишой просто нет. Правило говорит, как поделить короткую ночь. Такие
        времена помечены знаком <b>≈</b>.
      </div>

      <div className="sectitle">Поправка хиджры</div>
      <Chips
        value={s.hijriOffset}
        onChange={(v) => setSetting("hijriOffset", v)}
        options={[-2, -1, 0, 1, 2].map((n) => ({ value: n, label: n > 0 ? `+${n}` : String(n) }))}
      />
      <div className="note">Сдвиньте дату, если ваша мечеть считает иначе.</div>

      {!standalone && (
        <>
          <div className="sectitle">На экран «Домой»</div>
          <div className="card" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <ShareIcon style={{ color: "var(--jade)", flex: "none", marginTop: 2 }} />
            <div className="note" style={{ padding: 0 }}>
              В Safari нажмите <b>«Поделиться»</b> → <b>«На экран „Домой“»</b>. Приложение
              откроется без адресной строки и будет работать без интернета.
            </div>
          </div>
        </>
      )}

      <div className="sectitle">Данные</div>
      <button
        className="bigbtn"
        data-danger="true"
        onClick={() => {
          if (!confirmReset) {
            setConfirmReset(true);
            setTimeout(() => setConfirmReset(false), 3000);
            return;
          }
          resetAll();
          onClose();
        }}
      >
        {confirmReset ? "Точно стереть всё?" : "Стереть историю и настройки"}
      </button>
      <div className="note">
        Всё хранится только в этом браузере: ни аккаунта, ни сервера, ни единого запроса
        наружу. Стереть — значит стереть насовсем.
      </div>
      <div className="note" style={{ opacity: 0.6, paddingTop: 14 }}>
        Зикр · сборка {__BUILD__}
      </div>
    </Sheet>
  );
}
