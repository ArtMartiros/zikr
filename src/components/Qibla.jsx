import { useEffect, useState } from "react";
import Sheet from "./Sheet.jsx";
import { qiblaBearing, qiblaDistance, compassSide } from "../lib/qibla.mjs";

/* Компас.

   На iOS доступ к датчику надо просить, и просить строго из обработчика
   касания — поэтому кнопка, а не автозапуск. Там же приходит
   webkitCompassHeading: это уже готовый азимут на север, в отличие от
   сырого alpha, который на разных устройствах отсчитывается по-разному.

   Без датчика экран не пустеет: азимут и сторона света известны всегда,
   компас лишь превращает их в стрелку. */
export default function Qibla({ place, onClose }) {
  const bearing = qiblaBearing(place.lat, place.lon);
  const [heading, setHeading] = useState(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (typeof DeviceOrientationEvent === "undefined") return;
    if (typeof DeviceOrientationEvent.requestPermission === "function") return; // спросим по кнопке
    const handler = (e) => {
      const h = e.webkitCompassHeading ?? (e.absolute && e.alpha != null ? 360 - e.alpha : null);
      if (h != null) setHeading(h);
    };
    window.addEventListener("deviceorientationabsolute", handler);
    window.addEventListener("deviceorientation", handler);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handler);
      window.removeEventListener("deviceorientation", handler);
    };
  }, []);

  const ask = async () => {
    try {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res !== "granted") {
        setDenied(true);
        return;
      }
      window.addEventListener("deviceorientation", (e) => {
        const h = e.webkitCompassHeading ?? (e.alpha != null ? 360 - e.alpha : null);
        if (h != null) setHeading(h);
      });
    } catch {
      setDenied(true);
    }
  };

  const needsAsk =
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function" &&
    heading == null &&
    !denied;

  // Компас крутится вместе с телефоном, стрелка стоит на Каабе
  const faceRotation = heading == null ? 0 : -heading;

  return (
    <Sheet title="Кибла" onClose={onClose}>
      <div className="qibla">
        <div className="compass">
          <svg viewBox="0 0 200 200">
            <g className="face" style={{ transform: `rotate(${faceRotation}deg)`, transformOrigin: "100px 100px" }}>
              <circle cx="100" cy="100" r="92" fill="none" stroke="var(--line)" strokeWidth="1.5" />
              <circle cx="100" cy="100" r="78" fill="none" stroke="var(--line)" strokeWidth="1" />
              {Array.from({ length: 72 }, (_, i) => {
                const major = i % 6 === 0;
                const a = (i * 5 * Math.PI) / 180;
                const r1 = major ? 80 : 86;
                return (
                  <line
                    key={i}
                    x1={100 + 92 * Math.sin(a)}
                    y1={100 - 92 * Math.cos(a)}
                    x2={100 + r1 * Math.sin(a)}
                    y2={100 - r1 * Math.cos(a)}
                    stroke={major ? "var(--ink-3)" : "var(--line-2)"}
                    strokeWidth={major ? 1.8 : 1}
                  />
                );
              })}
              {[
                ["С", 0],
                ["В", 90],
                ["Ю", 180],
                ["З", 270],
              ].map(([label, deg]) => {
                const a = (deg * Math.PI) / 180;
                return (
                  <text
                    key={label}
                    x={100 + 66 * Math.sin(a)}
                    y={100 - 66 * Math.cos(a) + 5}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="700"
                    fill={deg === 0 ? "var(--danger)" : "var(--ink-3)"}
                  >
                    {label}
                  </text>
                );
              })}
              {/* Стрелка на Каабу поворачивается вместе с лимбом */}
              <g style={{ transform: `rotate(${bearing}deg)`, transformOrigin: "100px 100px" }}>
                <path
                  d="M100 18 L114 62 L100 54 L86 62 Z"
                  fill="var(--gold)"
                  stroke="var(--gold)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <line x1="100" y1="56" x2="100" y2="150" stroke="var(--gold-2)" strokeWidth="2.5" strokeLinecap="round" />
                <rect x="92" y="150" width="16" height="14" rx="2" fill="var(--gold-2)" />
              </g>
            </g>
            <circle cx="100" cy="100" r="5" fill="var(--jade)" />
          </svg>
        </div>

        <div className="qmeta">
          <b>{Math.round(bearing)}°</b>
          <div>
            {compassSide(bearing)} · до Каабы {qiblaDistance(place.lat, place.lon).toLocaleString("ru-RU")} км
          </div>
        </div>

        {needsAsk && (
          <button className="bigbtn" onClick={ask}>
            Включить компас
          </button>
        )}
        {heading == null && !needsAsk && (
          <div className="note" style={{ textAlign: "center" }}>
            Датчик направления недоступен. Наведите обычный компас на <b>{Math.round(bearing)}°</b> —
            это и есть кибла из точки «{place.name}».
          </div>
        )}
        {heading != null && (
          <div className="note" style={{ textAlign: "center" }}>
            Держите телефон горизонтально. Золотая стрелка смотрит на Каабу.
          </div>
        )}
      </div>
    </Sheet>
  );
}
