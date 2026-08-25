import { useEffect, useState } from "react";
import Counter, { CounterTitle } from "./screens/Counter.jsx";
import Prayers from "./screens/Prayers.jsx";
import Progress from "./screens/Progress.jsx";
import Sheet from "./components/Sheet.jsx";
import SetPicker from "./components/SetPicker.jsx";
import PlacePicker from "./components/PlacePicker.jsx";
import Settings from "./components/Settings.jsx";
import Ornament from "./components/Ornament.jsx";
import { BeadsIcon, MosqueIcon, ChartIcon, GearIcon } from "./components/Icons.jsx";
import { useStore, useNow } from "./lib/use.js";
import { keepAwake, watchWakeLock, unlockAudio } from "./lib/feedback.js";
import { prayerDay, currentAndNext, PRAYER_NAMES } from "./lib/prayer-times.mjs";
import { timeAt } from "./lib/format.js";

const TABS = [
  { id: "zikr", label: "Зикр", Icon: BeadsIcon },
  { id: "namaz", label: "Намаз", Icon: MosqueIcon },
  { id: "progress", label: "Прогресс", Icon: ChartIcon },
];

/* Цвет строки состояния подменяется руками: в standalone на iPhone под неё
   уходит верхняя чёлка, и несовпадение с фоном видно сразу. */
function useThemeColor(theme) {
  useEffect(() => {
    const root = document.documentElement;
    const dark =
      theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.setAttribute("data-theme", dark ? "dark" : "light");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#05100D" : "#F7F3EA");

    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      root.setAttribute("data-theme", mq.matches ? "dark" : "light");
      if (meta) meta.setAttribute("content", mq.matches ? "#05100D" : "#F7F3EA");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);
}

export default function App() {
  const state = useStore();
  const [tab, setTab] = useState("zikr");
  const [sheet, setSheet] = useState(null); // 'set' | 'place' | 'settings'
  const now = useNow(30000);

  useThemeColor(state.settings.theme);

  /* Замок экрана держим только на счётчике: на остальных вкладках держать
     телефон разбуженным незачем, а батарею жалко. */
  useEffect(() => {
    const want = state.settings.keepAwake && tab === "zikr";
    keepAwake(want);
    return watchWakeLock(() => state.settings.keepAwake && tab === "zikr");
  }, [state.settings.keepAwake, tab]);

  useEffect(() => {
    if (!state.settings.sound) return;
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [state.settings.sound]);

  // Подпись в шапке вкладки намаза — ближайшее время, чтобы не открывать вкладку ради него
  let namazHint = null;
  if (state.place) {
    try {
      const { next } = currentAndNext(state.place, now, state.settings);
      if (next) namazHint = `${PRAYER_NAMES[next.key]} в ${timeAt(next.at, state.place.tz)}`;
    } catch {
      namazHint = null;
    }
  }

  return (
    <div className="app">
      <div className="backdrop">
        <Ornament />
      </div>

      <div className="topbar">
        {tab === "zikr" ? (
          <CounterTitle state={state} onPick={() => setSheet("set")} />
        ) : (
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1>{tab === "namaz" ? "Намаз" : "Прогресс"}</h1>
            {tab === "namaz" && namazHint && <div className="sub">{namazHint}</div>}
          </div>
        )}
        <button className="iconbtn" onClick={() => setSheet("settings")} aria-label="Настройки">
          <GearIcon width="21" height="21" />
        </button>
      </div>

      <div className="screen">
        {tab === "zikr" && <Counter state={state} />}
        {tab === "namaz" && <Prayers state={state} onPickPlace={() => setSheet("place")} />}
        {tab === "progress" && <Progress state={state} />}
      </div>

      <nav className="nav">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} data-on={tab === id} onClick={() => setTab(id)}>
            <Icon />
            {label}
          </button>
        ))}
      </nav>

      {sheet === "set" && <SetPicker state={state} onClose={() => setSheet(null)} />}
      {sheet === "place" && <PlacePicker state={state} onClose={() => setSheet(null)} />}
      {sheet === "settings" && (
        <Settings state={state} onClose={() => setSheet(null)} onPickPlace={() => setSheet("place")} />
      )}
    </div>
  );
}
