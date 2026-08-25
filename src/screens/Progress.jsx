import { stats, lastDays, dayKey } from "../lib/store.js";
import { findSet, SETS } from "../data/dhikr.js";
import { PRAYER_KEYS, PRAYER_NAMES } from "../lib/prayer-times.mjs";
import { plural, bigNumber, weekdayShort } from "../lib/format.js";
import { FlameIcon } from "../components/Icons.jsx";

const NAMAZ = PRAYER_KEYS.filter((k) => k !== "sunrise");

export default function Progress({ state }) {
  const { days, settings, custom } = state;
  const s = stats(days);
  const today = days[dayKey()] || { total: 0, bySet: {}, prayers: {} };
  const chart = lastDays(days, 14);
  const week = lastDays(days, 7);
  const peak = Math.max(settings.dailyGoal, ...chart.map((d) => d.total)) || 1;
  const goalPct = Math.min(100, Math.round((today.total / settings.dailyGoal) * 100));
  const todayPrayers = NAMAZ.filter((k) => today.prayers[k]).length;

  const bySet = Object.entries(s.bySet)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  const empty = s.allTime === 0 && s.activeDays === 0;

  return (
    <div className="scroll">
      <div className="tiles" style={{ marginTop: 8 }}>
        <div className="tile jade">
          <div className="k">Сегодня</div>
          <div className="v">
            {bigNumber(today.total)}
            <small>из {bigNumber(settings.dailyGoal)}</small>
          </div>
          <div
            style={{
              height: 5,
              borderRadius: 3,
              background: "var(--surface-2)",
              marginTop: 9,
              overflow: "hidden",
            }}
          >
            <div style={{ width: `${goalPct}%`, height: "100%", background: "var(--jade)", borderRadius: 3 }} />
          </div>
        </div>

        <div className="tile gold">
          <div className="k">Серия</div>
          <div className="v" style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <FlameIcon width="22" height="22" />
            {s.streak}
            <small>{plural(s.streak, "день", "дня", "дней")}</small>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 550, marginTop: 9 }}>
            {s.streak === 0 ? "Начните сегодня" : `Активных дней: ${s.activeDays}`}
          </div>
        </div>

        <div className="tile">
          <div className="k">Всего зикров</div>
          <div className="v">{bigNumber(s.allTime)}</div>
        </div>

        <div className="tile">
          <div className="k">Намазы сегодня</div>
          <div className="v">
            {todayPrayers}
            <small>из 5</small>
          </div>
        </div>
      </div>

      <div className="sectitle">Две недели</div>
      <div className="card">
        <div className="chart">
          {chart.map((d, i) => (
            <div className="bar" key={d.key} data-today={i === chart.length - 1}>
              <div
                className="fill"
                data-empty={d.total === 0}
                style={{ height: `${Math.max(3, (d.total / peak) * 78)}px` }}
              />
              <div className="d">{d.date.getDate()}</div>
            </div>
          ))}
        </div>
        <div className="legend">
          <span>Цель — {bigNumber(settings.dailyGoal)} в день</span>
          <span>Лучший день — {bigNumber(s.best)}</span>
        </div>
      </div>

      <div className="sectitle">Намазы за неделю</div>
      <div className="card">
        <div className="grid7">
          {week.map((d) => (
            <div className="col" key={d.key}>
              <div className="lbl">{weekdayShort(d.date).replace(".", "")}</div>
              {NAMAZ.map((k) => (
                <div key={k} className="dot" data-on={!!d.prayers[k]} title={PRAYER_NAMES[k]} />
              ))}
            </div>
          ))}
        </div>
        <div className="legend">
          <span>Строки сверху вниз: фаджр, зухр, аср, магриб, иша</span>
        </div>
      </div>

      {bySet.length > 0 && (
        <>
          <div className="sectitle">По наборам</div>
          <div className="rows">
            {bySet.map(([id, n]) => {
              const set = findSet(id, custom) || SETS[0];
              return (
                <div className="row" key={id}>
                  <span className="grow">
                    <span className="name">{set.name}</span>
                    <span className="hint">{set.note}</span>
                  </span>
                  <span className="val">{bigNumber(n)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {empty && (
        <div className="empty">
          Здесь появится история: сколько зикров в день, серия дней подряд
          и отмеченные намазы. Пока пусто — начните со счётчика.
        </div>
      )}
    </div>
  );
}
