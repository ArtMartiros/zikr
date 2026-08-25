import { useCallback, useEffect, useRef, useState } from "react";
import { PHRASES, findSet, setTotal } from "../data/dhikr.js";
import { advanceCounter, retreatCounter, setCounter } from "../lib/store.js";
import { haptic, click } from "../lib/feedback.js";
import { UndoIcon, ResetIcon, ChevronIcon } from "../components/Icons.jsx";
import { plural } from "../lib/format.js";

const R = 88;
const C = 2 * Math.PI * R;

/* Фраза шага: либо из справочника, либо своя, если человек завёл свой зикр. */
function phraseOf(step) {
  return step.phrase ? PHRASES[step.phrase] : { ar: step.ar || "", tr: step.tr || "", ru: step.ru || "" };
}

export default function Counter({ state, onPickSet }) {
  const { counter, custom, settings } = state;
  const set = findSet(counter.setId, custom);
  const stepIndex = Math.min(counter.step, set.steps.length - 1);
  const step = set.steps[stepIndex];
  const phrase = phraseOf(step);
  const target = step.target;
  const count = counter.count;

  const [ripples, setRipples] = useState([]);
  const [flash, setFlash] = useState(0);
  const [banner, setBanner] = useState(null);
  const [armed, setArmed] = useState(false);
  const armTimer = useRef(null);

  useEffect(() => () => clearTimeout(armTimer.current), []);

  const feedback = useCallback(
    (kind) => {
      if (settings.haptics) haptic(kind);
      if (settings.sound) click(kind);
    },
    [settings.haptics, settings.sound]
  );

  const tap = useCallback(
    (e) => {
      // pointerdown, а не click: между касанием и click на мобильном проходит
      // заметная пауза, и счётчик начинает казаться тормозящим
      const id = Math.random();
      const x = e.clientX;
      const y = e.clientY;
      setRipples((r) => [...r.slice(-4), { id, x, y }]);
      setTimeout(() => setRipples((r) => r.filter((p) => p.id !== id)), 600);

      // Всё состояние счётчика двигает store, атомарно: тап может прийти
      // раньше, чем React перерисует прошлый
      const outcome = advanceCounter(set);
      if (!outcome) return;

      if (outcome.kind === "tick") {
        feedback("tick");
        return;
      }
      setFlash(Date.now());
      feedback("done");
      if (outcome.kind === "lap") {
        setBanner({ id: Date.now(), laps: outcome.laps });
        setTimeout(() => setBanner(null), 1600);
      }
    },
    [set, feedback]
  );

  const undo = () => {
    if (retreatCounter(set) && settings.haptics) haptic("soft");
  };

  /* Сброс в два касания. Одно — и половина людей однажды потеряет
     сорок седьмой счёт, положив телефон в карман. */
  const reset = () => {
    if (!armed) {
      setArmed(true);
      if (settings.haptics) haptic("soft");
      armTimer.current = setTimeout(() => setArmed(false), 2600);
      return;
    }
    clearTimeout(armTimer.current);
    setArmed(false);
    setCounter({ step: 0, count: 0, laps: 0 });
    if (settings.haptics) haptic("done");
  };

  const progress = target ? count / target : 0;
  // До сорока произнесений кольцо рисуется бусинами, дальше — сплошной дугой
  const beads = target <= 40;
  const arSize = phrase.ar.length > 45 ? "ar xlong" : phrase.ar.length > 26 ? "ar long" : "ar";
  const done = setTotal(set) * counter.laps + set.steps.slice(0, stepIndex).reduce((a, s) => a + s.target, 0) + count;

  return (
    <div className="counter">
      <button className="tapzone" onPointerDown={tap} aria-label={`Засчитать зикр, ${count} из ${target}`} />

      {ripples.map((r) => (
        <span key={r.id} className="ripple" style={{ left: r.x, top: r.y }} />
      ))}
      {flash > 0 && <span key={flash} className="flash" onAnimationEnd={() => setFlash(0)} />}
      {banner && (
        <div className="banner" key={banner.id}>
          <b>Круг {banner.laps}</b>
          <span>
            {set.name} · {setTotal(set)}
          </span>
        </div>
      )}

      <div className="stage">
        <div className="phrase">
          <div className={arSize} lang="ar" dir="rtl">
            {phrase.ar}
          </div>
          <div className="tr">{phrase.tr}</div>
          {phrase.ru && <div className="ru">{phrase.ru}</div>}
        </div>

        <div className="dial">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <defs>
              {/* Дуга растёт по часовой от верха, и золото должно быть на её
                  переднем краю: тогда цвет сам показывает, куда идёт счёт.
                  С учётом поворота дуги на −90° это значит обратный порядок
                  остановок относительно интуитивного. */}
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--gold)" />
                <stop offset="100%" stopColor="var(--jade)" />
              </linearGradient>
              <radialGradient id="haloGrad">
                <stop offset="0%" stopColor="var(--jade)" stopOpacity="0.22" />
                <stop offset="70%" stopColor="var(--jade)" stopOpacity="0.05" />
                <stop offset="100%" stopColor="var(--jade)" stopOpacity="0" />
              </radialGradient>
            </defs>

            <circle className="halo" cx="100" cy="100" r="78" opacity={0.25 + progress * 0.75} />
            <circle className="track" cx="100" cy="100" r={R} />

            {beads ? (
              <g className="beads">
                {Array.from({ length: target }, (_, i) => {
                  const a = (i / target) * 2 * Math.PI - Math.PI / 2;
                  const on = i < count;
                  return (
                    <circle
                      key={i}
                      className="bead"
                      data-on={on}
                      data-last={on && i === count - 1}
                      cx={100 + R * Math.cos(a)}
                      cy={100 + R * Math.sin(a)}
                      r={on && i === count - 1 ? 5.4 : 3.9}
                    />
                  );
                })}
              </g>
            ) : (
              <>
                <circle className="arcbed" cx="100" cy="100" r={R} />
                <circle
                  className="prog"
                  cx="100"
                  cy="100"
                  r={R}
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - progress)}
                />
              </>
            )}
          </svg>
          <div className="inner">
            <div className="count pop" key={`${stepIndex}-${count}`}>
              {count}
            </div>
            <div className="of">из {target}</div>
            {set.steps.length > 1 && (
              <div className="steps">
                {set.steps.map((s, i) => (
                  <i key={i} data-on={i === stepIndex} data-done={i < stepIndex} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="footbar">
        <div className="laps">
          <b>{counter.laps}</b>
          {plural(counter.laps, "круг", "круга", "кругов")}
          <span style={{ opacity: 0.55 }}>· всего {done}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="pill" onClick={undo} aria-label="Отменить последнее">
            <UndoIcon />
          </button>
          <button className="pill" data-armed={armed} onClick={reset}>
            <ResetIcon />
            {armed ? "Точно?" : "Сброс"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Шапка счётчика вынесена наружу: заголовок экрана и есть переключатель
   набора, и нажимать на него удобнее в самом верху. */
export function CounterTitle({ state, onPick }) {
  const set = findSet(state.counter.setId, state.custom);
  return (
    <button
      className="pill"
      onClick={onPick}
      style={{ flex: 1, justifyContent: "space-between", minWidth: 0 }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--ink)" }}>
        {set.name}
      </span>
      <ChevronIcon style={{ transform: "rotate(90deg)", flex: "none" }} />
    </button>
  );
}
