import { useMemo, useState } from "react";
import { prayerDay, currentAndNext, PRAYER_KEYS, PRAYER_NAMES, PRAYER_HINTS, METHODS } from "../lib/prayer-times.mjs";
import { hijriOf, formatHijri, hijriNote } from "../lib/hijri.mjs";
import { qiblaBearing, qiblaDistance, compassSide } from "../lib/qibla.mjs";
import { togglePrayer, dayKey } from "../lib/store.js";
import { haptic } from "../lib/feedback.js";
import { useNow } from "../lib/use.js";
import { timeAt, dateLong, timeLeft } from "../lib/format.js";
import { CheckIcon, PinIcon, CompassIcon, ChevronIcon } from "../components/Icons.jsx";
import Qibla from "../components/Qibla.jsx";

export default function Prayers({ state, onPickPlace }) {
  const { place, settings, days } = state;
  const now = useNow(15000);
  const [qiblaOpen, setQiblaOpen] = useState(false);

  const day = useMemo(
    () => (place ? prayerDay(place, now, settings) : null),
    // now меняется каждые 15 секунд, а таблица на день — нет: пересчёт
    // привязан к дате, иначе строки перерисовывались бы вхолостую
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [place, settings, place ? dayKey(now, place.tz) : null]
  );

  const upcoming = useMemo(
    () => (place ? currentAndNext(place, now, settings) : null),
    [place, settings, now]
  );

  if (!place) {
    return (
      <div className="scroll">
        <div className="card" style={{ marginTop: 12, textAlign: "center", padding: "26px 20px" }}>
          <PinIcon width="30" height="30" style={{ color: "var(--jade)" }} />
          <div style={{ fontSize: 17, fontWeight: 750, marginTop: 10 }}>Где вы находитесь?</div>
          <div className="note" style={{ padding: "6px 0 16px" }}>
            Времена намаза считаются прямо на телефоне — по координатам, солнцу и выбранному
            методу. Ни один запрос никуда не уходит, поэтому дальше всё работает и без сети.
          </div>
          <button className="bigbtn" onClick={onPickPlace}>
            Выбрать место
          </button>
        </div>
      </div>
    );
  }

  const tz = place.tz;
  const todayKey = dayKey(now, tz);
  const marks = days[todayKey]?.prayers || {};
  const afterSunset = day && now >= day.at.maghrib;
  const hijri = hijriOf(now, { offset: settings.hijriOffset, timeZone: tz, afterSunset });
  const note = hijriNote(hijri);
  const bearing = qiblaBearing(place.lat, place.lon);

  const toggle = (key) => {
    togglePrayer(key, todayKey);
    if (settings.haptics) haptic(marks[key] ? "soft" : "tick");
  };

  const doneCount = PRAYER_KEYS.filter((k) => k !== "sunrise" && marks[k]).length;

  return (
    <div className="scroll">
      <div style={{ padding: "6px 4px 12px" }}>
        <div style={{ fontSize: 20, fontWeight: 750, letterSpacing: "-0.02em" }}>
          {dateLong(now, tz)}
        </div>
        <div style={{ fontSize: 13, color: "var(--gold)", fontWeight: 600, marginTop: 2 }}>
          {formatHijri(hijri)}
          {note && <span style={{ color: "var(--ink-3)" }}> · {note}</span>}
        </div>
      </div>

      {upcoming?.next && (
        <div className="card accent next">
          <div className="label">Следующий намаз</div>
          <div className="name">{PRAYER_NAMES[upcoming.next.key]}</div>
          <div className="time">
            <b>{timeAt(upcoming.next.at, tz)}</b>
            <span>через {timeLeft(upcoming.next.at - now)}</span>
          </div>
        </div>
      )}

      <div className="sectitle">
        Сегодня · отмечено {doneCount} из 5
      </div>
      <div className="rows">
        {PRAYER_KEYS.map((key) => {
          const passive = key === "sunrise";
          const isNow = upcoming?.current?.key === key;
          const estimated = day.estimated[key];
          return (
            <button
              key={key}
              className="prayerrow"
              data-now={isNow}
              data-passive={passive}
              onClick={() => !passive && toggle(key)}
              disabled={passive}
            >
              {passive ? (
                <span style={{ width: 25, flex: "none", textAlign: "center", color: "var(--ink-3)" }}>
                  ☀
                </span>
              ) : (
                <span className="tick" data-on={!!marks[key]}>
                  <CheckIcon />
                </span>
              )}
              <span className="pname">
                {PRAYER_NAMES[key]}
                <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 550, display: "block" }}>
                  {PRAYER_HINTS[key]}
                </span>
              </span>
              <span className="ptime">
                {timeAt(day.at[key], tz)}
                {estimated && <span className="est" title="Расчётное время">≈</span>}
              </span>
            </button>
          );
        })}
      </div>

      {(day.estimated.fajr || day.estimated.isha) && (
        <div className="note">
          <b>≈</b> — на этой широте солнце не опускается на нужный угол, и время получено
          делением ночи ({METHODS[settings.method].name}, правило «{settings.highLat === "seventh" ? "1/7 ночи" : settings.highLat === "middle" ? "1/2 ночи" : "по углу"}»).
          Правило меняется в настройках.
        </div>
      )}

      <div className="sectitle">Направление и место</div>
      <div className="rows">
        <button className="row" onClick={() => setQiblaOpen(true)}>
          <CompassIcon style={{ color: "var(--gold)", flex: "none" }} />
          <span className="grow">
            <span className="name">Кибла</span>
            <span className="hint">
              {Math.round(bearing)}° · {compassSide(bearing)} · {qiblaDistance(place.lat, place.lon).toLocaleString("ru-RU")} км
            </span>
          </span>
          <ChevronIcon style={{ color: "var(--ink-3)", flex: "none", width: 18, height: 18 }} />
        </button>
        <button className="row" onClick={onPickPlace}>
          <PinIcon style={{ color: "var(--jade)", flex: "none" }} />
          <span className="grow">
            <span className="name">{place.name}</span>
            <span className="hint">
              {place.lat.toFixed(3)}, {place.lon.toFixed(3)} · {METHODS[settings.method].short}
            </span>
          </span>
          <ChevronIcon style={{ color: "var(--ink-3)", flex: "none", width: 18, height: 18 }} />
        </button>
      </div>

      <div className="note">
        День по хиджре начинается с закатом, поэтому после магриба дата уже
        следующая. Календарь — Умм аль-Кура; мечети расходятся на день, поправка есть в настройках.
      </div>

      {qiblaOpen && <Qibla place={place} onClose={() => setQiblaOpen(false)} />}
    </div>
  );
}
