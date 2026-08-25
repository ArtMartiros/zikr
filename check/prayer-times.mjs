/* Времена намаза считаются на устройстве, и проверить их некому — сервера
   нет, сравнить не с чем. Поэтому проверка держится за два якоря.

   Первый: восход и закат — вещь публичная и общеизвестная. Если они сходятся
   с реальностью до минут, значит и положение Солнца посчитано верно, а из
   него уже выводятся все остальные времена.

   Второй: свойства, которые обязаны выполняться всегда и везде. Порядок
   намазов, симметрия восхода и заката вокруг полудня, ханафитский аср
   позже обычного, отсутствие NaN за полярным кругом. Ошибки в знаке,
   в часовом поясе и в переходе на летнее время ловятся именно здесь. */

import {
  prayerDay,
  computeTimes,
  currentAndNext,
  PRAYER_KEYS,
  METHODS,
} from "../src/lib/prayer-times.mjs";
import { ok, near, section, done } from "./lib.mjs";

const hhmm = (date, tz) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);

const minutesOf = (date, tz) => {
  const [h, m] = hhmm(date, tz).split(":").map(Number);
  return h * 60 + m;
};

const PLACES = {
  moscow: { name: "Москва", lat: 55.7558, lon: 37.6173, tz: "Europe/Moscow" },
  london: { name: "Лондон", lat: 51.5074, lon: -0.1278, tz: "Europe/London" },
  mecca: { name: "Мекка", lat: 21.4225, lon: 39.8262, tz: "Asia/Riyadh" },
  newyork: { name: "Нью-Йорк", lat: 40.7128, lon: -74.006, tz: "America/New_York" },
  murmansk: { name: "Мурманск", lat: 68.9585, lon: 33.0827, tz: "Europe/Moscow" },
  jakarta: { name: "Джакарта", lat: -6.2088, lon: 106.8456, tz: "Asia/Jakarta" },
};

const at = (day) => new Date(day + "T10:00:00Z");

section("Восход и закат против реальности");
/* [место, дата, восход, закат] — местное время площадки, включая переход
   на летнее. Допуск 4 минуты: в него укладывается разница в модели
   рефракции, но не укладывается ошибка в формуле. */
const ANCHORS = [
  ["moscow", "2025-06-21", "03:44", "21:17"],
  ["moscow", "2025-12-21", "08:57", "15:57"],
  ["london", "2025-06-21", "04:43", "21:21"],
  ["mecca", "2025-01-01", "06:58", "17:49"],
  ["newyork", "2025-09-22", "06:42", "18:52"],
];
for (const [key, date, sunrise, sunset] of ANCHORS) {
  const place = PLACES[key];
  const day = prayerDay(place, at(date), {});
  const toMin = (s) => +s.slice(0, 2) * 60 + +s.slice(3);
  near(minutesOf(day.at.sunrise, place.tz), toMin(sunrise), 4, `${place.name} ${date}, восход`);
  near(minutesOf(day.at.maghrib, place.tz), toMin(sunset), 4, `${place.name} ${date}, закат`);
}

section("Порядок намазов и отсутствие дыр");
const DATES = ["2025-01-15", "2025-03-20", "2025-06-21", "2025-09-23", "2025-12-21"];
for (const place of Object.values(PLACES)) {
  for (const date of DATES) {
    for (const method of Object.keys(METHODS)) {
      const day = prayerDay(place, at(date), { method });
      const bad = PRAYER_KEYS.filter((k) => Number.isNaN(day.at[k].getTime()));
      if (!ok(bad.length === 0, `${place.name} ${date} ${method}: нет NaN (${bad.join(", ")})`)) continue;
      const t = PRAYER_KEYS.map((k) => day.at[k].getTime());
      for (let i = 1; i < t.length; i++) {
        if (!ok(t[i] > t[i - 1], `${place.name} ${date} ${method}: ${PRAYER_KEYS[i]} позже ${PRAYER_KEYS[i - 1]}`)) break;
      }
    }
  }
}

section("Симметрия и полдень");
for (const place of Object.values(PLACES)) {
  for (const date of DATES) {
    const day = prayerDay(place, at(date), {});
    if (day.polar) continue;
    const before = day.at.dhuhr - day.at.sunrise;
    const after = day.at.maghrib - day.at.dhuhr;
    near(before / 60000, after / 60000, 1.5, `${place.name} ${date}: восход и закат симметричны вокруг полудня`);
  }
}

section("Равноденствие: день длиной примерно 12 часов");
for (const place of Object.values(PLACES)) {
  const day = prayerDay(place, at("2025-03-20"), {});
  const hours = (day.at.maghrib - day.at.sunrise) / 3600e3;
  near(hours, 12.13, 0.35, `${place.name}: длина дня в равноденствие`);
}

section("Аср по мазхабам");
for (const place of Object.values(PLACES)) {
  for (const date of DATES) {
    const a = prayerDay(place, at(date), { asrFactor: 1 });
    const b = prayerDay(place, at(date), { asrFactor: 2 });
    ok(b.at.asr > a.at.asr, `${place.name} ${date}: ханафитский аср позже обычного`);
    ok(b.at.asr < b.at.maghrib, `${place.name} ${date}: ханафитский аср до магриба`);
  }
}

section("Умм аль-Кура: иша ровно через 90 минут после магриба");
for (const place of Object.values(PLACES)) {
  const day = prayerDay(place, at("2025-05-10"), { method: "umm" });
  if (day.polar) continue;
  near((day.at.isha - day.at.maghrib) / 60000, 90, 0.6, `${place.name}: промежуток магриб → иша`);
}

section("Высокие широты помечены расчётными");
const msk = prayerDay(PLACES.moscow, at("2025-06-21"), { method: "mwl" });
ok(msk.estimated.fajr && msk.estimated.isha, "Москва в июне: фаджр и иша — расчётные");
const mkk = prayerDay(PLACES.mecca, at("2025-06-21"), { method: "mwl" });
ok(!mkk.estimated.fajr && !mkk.estimated.isha, "Мекка: астрономические времена, без оценки");
const polar = prayerDay(PLACES.murmansk, at("2025-06-21"), { method: "mwl" });
ok(polar.polar, "Мурманск в июне: полярный день распознан");
ok(polar.at.sunrise < polar.at.maghrib, "Мурманск: подстановка ближайшей широты дала осмысленный день");

section("Правила деления ночи упорядочены");
for (const rule of ["angle", "seventh", "middle"]) {
  const day = prayerDay(PLACES.moscow, at("2025-06-21"), { method: "mwl", highLat: rule });
  ok(day.at.fajr < day.at.sunrise, `Москва, правило «${rule}»: фаджр до восхода`);
  ok(day.at.isha > day.at.maghrib, `Москва, правило «${rule}»: иша после магриба`);
}
const middle = prayerDay(PLACES.moscow, at("2025-06-21"), { highLat: "middle" });
const seventh = prayerDay(PLACES.moscow, at("2025-06-21"), { highLat: "seventh" });
ok(middle.at.isha > seventh.at.isha, "половина ночи даёт ишу позже, чем одна седьмая");

section("Переход на летнее время");
/* Москва пояс не переводит, а Лондон переводит: если бы смещение бралось
   числом, а не именем зоны, здесь бы всё и рассыпалось. */
const winter = prayerDay(PLACES.london, at("2025-01-15"), {});
const summer = prayerDay(PLACES.london, at("2025-07-15"), {});
near(minutesOf(winter.at.dhuhr, "Europe/London"), 12 * 60 + 8, 6, "Лондон зимой: полдень около 12:08");
near(minutesOf(summer.at.dhuhr, "Europe/London"), 13 * 60 + 6, 6, "Лондон летом: полдень около 13:06");

section("Следующий намаз");
const now = new Date("2025-08-25T09:00:00Z");
const { current, next } = currentAndNext(PLACES.moscow, now, {});
ok(current && next, "текущий и следующий намаз найдены");
ok(current.at <= now && next.at > now, "текущий уже начался, следующий ещё нет");
ok(next.at - now < 26 * 3600e3, "следующий намаз не дальше суток");
// После иши следующим обязан быть завтрашний фаджр, а не сегодняшний
const night = currentAndNext(PLACES.moscow, new Date("2025-08-25T20:00:00Z"), {});
ok(night.next.key === "fajr", "после иши следующий — фаджр");
ok(night.next.at > new Date("2025-08-25T20:00:00Z"), "и он в будущем, а не сегодня утром");

section("Устойчивость к границам суток");
for (let h = 0; h < 24; h++) {
  const t = new Date(Date.UTC(2025, 6, 15, h, 30));
  const r = currentAndNext(PLACES.moscow, t, {});
  if (!ok(r.next && r.next.at > t, `час ${h}: следующий намаз строго в будущем`)) break;
}

section("Голая математика без часовых поясов");
const raw = computeTimes({
  date: { year: 2025, month: 3, day: 20 },
  latitude: 0,
  longitude: 0,
  timezoneMinutes: 0,
});
near(raw.times.dhuhr, 12.13, 0.05, "на нулевом меридиане полдень около 12:08");
near(raw.times.sunrise, 6.06, 0.06, "на экваторе в равноденствие восход около 6:04");

done("Времена намаза");
