/* Всё состояние живёт в localStorage и только там. Ни аккаунта, ни сервера,
   ни единого сетевого запроса: счётчик зикров — не то, что стоит куда-то
   отправлять, да и работать он обязан в самолёте и в подвале.

   Подписка сделана через useSyncExternalStore: одна версия состояния на всё
   приложение, перерисовка по факту записи. */

import { DEFAULT_SET } from "../data/dhikr.js";

const KEY = "zikr.v1";

const DEFAULTS = {
  settings: {
    theme: "system", // system | dark | light
    haptics: true,
    sound: false,
    keepAwake: true,
    dailyGoal: 300,
    method: "russia",
    asrFactor: 1, // 1 — большинство мазхабов, 2 — ханафитский
    highLat: "angle",
    hijriOffset: 0,
    adjust: {}, // ручная поправка к намазам, минуты
  },
  place: null, // { name, lat, lon, tz, source }
  counter: { setId: DEFAULT_SET, step: 0, count: 0, laps: 0 },
  custom: null, // свой зикр
  days: {}, // "2025-08-25": { total, bySet: {}, prayers: {} }
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...parsed,
      settings: { ...DEFAULTS.settings, ...(parsed.settings || {}) },
      counter: { ...DEFAULTS.counter, ...(parsed.counter || {}) },
      days: parsed.days || {},
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

let state = load();
const listeners = new Set();

/* Запись в localStorage при каждом нажатии — лишнее: тап может идти по
   несколько раз в секунду. Собираем в один кадр и пишем один раз. */
let flushTimer = null;
function persist() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* приватный режим или переполнение — приложение продолжает работать */
    }
  }, 250);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState() {
  return state;
}

export function update(fn) {
  const next = fn(state);
  if (next === state) return;
  state = next;
  persist();
  for (const l of listeners) l();
}

/* Локальная дата площадки в виде "2025-08-25" — ключ дня в статистике. */
export function dayKey(date = new Date(), timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone || undefined,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function setSetting(key, value) {
  update((s) => ({ ...s, settings: { ...s.settings, [key]: value } }));
}

export function setPlace(place) {
  update((s) => ({ ...s, place }));
}

export function setCustom(custom) {
  update((s) => ({ ...s, custom }));
}

export function setCounter(counter) {
  update((s) => ({ ...s, counter: { ...s.counter, ...counter } }));
}

/* Шаг счётчика — одна неделимая операция над свежайшим состоянием, а не
   «прочитать в рендере, прибавить, записать».

   Разница не теоретическая. Зикр читают быстро, тапов может прийти пять
   в секунду, и React успевает перерисоваться далеко не между каждыми
   двумя. Обработчик, взявший count из замыкания рендера, все эти тапы
   видит одинаковым числом — и девятнадцать нажатий превращаются в одно.
   Здесь же состояние берётся в момент записи, поэтому теряться нечему.

   Возвращает, что именно произошло: интерфейсу нужно знать, показывать ли
   вспышку и объявлять ли круг. */
export function advanceCounter(set) {
  let outcome = null;
  update((s) => {
    const stepIndex = Math.min(s.counter.step, set.steps.length - 1);
    const target = set.steps[stepIndex].target;
    const next = s.counter.count + 1;

    const key = dayKey();
    const day = s.days[key] || { total: 0, bySet: {}, prayers: {} };
    const days = {
      ...s.days,
      [key]: {
        ...day,
        total: day.total + 1,
        bySet: { ...day.bySet, [set.id]: (day.bySet[set.id] || 0) + 1 },
      },
    };

    if (next < target) {
      outcome = { kind: "tick", count: next };
      return { ...s, counter: { ...s.counter, count: next }, days };
    }
    if (stepIndex + 1 < set.steps.length) {
      outcome = { kind: "step", step: stepIndex + 1 };
      return { ...s, counter: { ...s.counter, step: stepIndex + 1, count: 0 }, days };
    }
    const laps = s.counter.laps + 1;
    outcome = { kind: "lap", laps };
    return { ...s, counter: { ...s.counter, step: 0, count: 0, laps }, days };
  });
  return outcome;
}

/* Откат — тоже одной операцией, и по тем же причинам. На границе шага
   возвращает в конец предыдущего: иначе «минус один» на нуле не делал бы
   ничего, а промах пальцем как раз чаще всего случается сразу после
   перехода на новую фразу. */
export function retreatCounter(set) {
  let moved = false;
  update((s) => {
    const c = s.counter;
    const stepIndex = Math.min(c.step, set.steps.length - 1);
    let counter;
    if (c.count > 0) {
      counter = { ...c, count: c.count - 1 };
    } else if (stepIndex > 0) {
      counter = { ...c, step: stepIndex - 1, count: set.steps[stepIndex - 1].target - 1 };
    } else if (c.laps > 0) {
      const last = set.steps[set.steps.length - 1];
      counter = { ...c, laps: c.laps - 1, step: set.steps.length - 1, count: last.target - 1 };
    } else {
      return s;
    }
    moved = true;

    const key = dayKey();
    const day = s.days[key] || { total: 0, bySet: {}, prayers: {} };
    const days = {
      ...s.days,
      [key]: {
        ...day,
        total: Math.max(0, day.total - 1),
        bySet: { ...day.bySet, [set.id]: Math.max(0, (day.bySet[set.id] || 0) - 1) },
      },
    };
    return { ...s, counter, days };
  });
  return moved;
}

function touchDay(s, key, fn) {
  const day = s.days[key] || { total: 0, bySet: {}, prayers: {} };
  return { ...s, days: { ...s.days, [key]: fn(day) } };
}

export function togglePrayer(prayerKey, dateKey = dayKey()) {
  update((s) =>
    touchDay(s, dateKey, (day) => ({
      ...day,
      prayers: { ...day.prayers, [prayerKey]: !day.prayers[prayerKey] },
    }))
  );
}

export function resetAll() {
  state = structuredClone(DEFAULTS);
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* нечего чистить */
  }
  for (const l of listeners) l();
}

/* Статистика. Серия — сколько дней подряд, считая от сегодня, было хоть
   что-то: зикр или отмеченный намаз. Сегодняшний пустой день серию не рвёт,
   иначе она обнулялась бы каждое утро. */
export function stats(days) {
  const keys = Object.keys(days).sort();
  const today = dayKey();
  const alive = (k) => {
    const d = days[k];
    return d && (d.total > 0 || Object.values(d.prayers || {}).some(Boolean));
  };

  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 3650; i++) {
    const k = dayKey(cursor);
    if (alive(k)) streak++;
    else if (k !== today) break;
    cursor.setDate(cursor.getDate() - 1);
  }

  const allTime = keys.reduce((sum, k) => sum + (days[k].total || 0), 0);
  const bySet = {};
  for (const k of keys) {
    for (const [id, n] of Object.entries(days[k].bySet || {})) bySet[id] = (bySet[id] || 0) + n;
  }

  let best = 0;
  for (const k of keys) best = Math.max(best, days[k].total || 0);

  return { streak, allTime, bySet, best, activeDays: keys.filter(alive).length };
}

/* Последние n дней подряд, включая пустые: график не должен «схлопывать»
   пропуски, иначе он врёт про регулярность. */
export function lastDays(days, n) {
  const out = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    const k = dayKey(cursor);
    out.push({ key: k, date: new Date(cursor), ...(days[k] || { total: 0, bySet: {}, prayers: {} }) });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}
