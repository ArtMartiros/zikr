import { useMemo, useState } from "react";
import Sheet from "./Sheet.jsx";
import { CITIES, searchCities } from "../data/cities.js";
import { setPlace } from "../lib/store.js";
import { CheckIcon, PinIcon } from "./Icons.jsx";

/* Ближайший известный город к координатам — чтобы вместо «55.751, 37.618»
   в интерфейсе стояло «Москва». Расстояние грубое, по плоскости: на сотне
   километров кривизна земли роли не играет. */
function nearestCity(lat, lon) {
  let best = null;
  let bestKm = Infinity;
  for (const c of CITIES) {
    const dx = (c.lon - lon) * Math.cos((lat * Math.PI) / 180) * 111;
    const dy = (c.lat - lat) * 111;
    const km = Math.hypot(dx, dy);
    if (km < bestKm) {
      bestKm = km;
      best = c;
    }
  }
  return bestKm < 75 ? best : null;
}

export default function PlacePicker({ state, onClose }) {
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);
  const list = useMemo(() => searchCities(query), [query]);
  const place = state.place;

  const locate = () => {
    if (!navigator.geolocation) {
      setError("Браузер не умеет определять место — выберите город из списка.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const near = nearestCity(lat, lon);
        setPlace({
          name: near ? near.name : "Моё место",
          lat: +lat.toFixed(4),
          lon: +lon.toFixed(4),
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          source: "gps",
        });
        setLocating(false);
        onClose();
      },
      () => {
        setLocating(false);
        setError("Не удалось получить координаты. Разрешите доступ или выберите город.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  };

  return (
    <Sheet title="Место" onClose={onClose}>
      <button className="bigbtn" onClick={locate} disabled={locating} style={{ marginTop: 4 }}>
        {locating ? "Определяем…" : "Определить по геолокации"}
      </button>
      {error && <div className="note" style={{ color: "var(--danger)" }}>{error}</div>}

      <input
        className="field"
        style={{ marginTop: 12 }}
        placeholder="Поиск города"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />

      <div className="rows" style={{ marginTop: 10 }}>
        {list.map((c) => (
          <button
            className="row"
            key={c.name}
            onClick={() => {
              setPlace({ ...c, source: "city" });
              onClose();
            }}
          >
            <PinIcon style={{ color: "var(--ink-3)", flex: "none", width: 18, height: 18 }} />
            <span className="grow">
              <span className="name">{c.name}</span>
              <span className="hint">
                {c.lat.toFixed(2)}, {c.lon.toFixed(2)}
              </span>
            </span>
            {place?.name === c.name && (
              <span className="tick" data-on="true">
                <CheckIcon />
              </span>
            )}
          </button>
        ))}
        {list.length === 0 && <div className="empty">Такого города в списке нет. Определите место по геолокации.</div>}
      </div>

      <div className="note">
        Координаты никуда не отправляются: и времена намаза, и кибла считаются на самом
        устройстве. Поэтому же выбранное место продолжает работать без сети.
      </div>
    </Sheet>
  );
}
