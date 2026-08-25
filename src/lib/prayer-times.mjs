/* Времена намаза считаются на устройстве, без сети и без чужого сервера.
   Астрономия здесь ровно та же, что в общепринятой реализации PrayTimes:
   положение Солнца по упрощённым формулам NOAA, дальше — часовой угол для
   нужной высоты Солнца.

   Отдельно про высокие широты. В Москве в июне Солнце не опускается на 17°
   под горизонт, и «настоящей» иши там просто нет: формула честно возвращает
   NaN. Молчать об этом нельзя — намаз-то читают. Поэтому ночь делится по
   выбранному правилу, и время получается из доли ночи, а флаг estimated
   говорит интерфейсу показать, что это расчётная оценка, а не астрономия. */

const RAD = Math.PI / 180;
const sin = (d) => Math.sin(d * RAD);
const cos = (d) => Math.cos(d * RAD);
const tan = (d) => Math.tan(d * RAD);
const arcsin = (x) => Math.asin(x) / RAD;
const arccos = (x) => Math.acos(x) / RAD;
const arctan2 = (y, x) => Math.atan2(y, x) / RAD;
const arccot = (x) => Math.atan(1 / x) / RAD;

const wrap = (a, range) => {
  const v = a - range * Math.floor(a / range);
  return v < 0 ? v + range : v;
};
const fixAngle = (a) => wrap(a, 360);
const fixHour = (a) => wrap(a, 24);

/* Юлианская дата на полночь UTC указанного гражданского дня. */
export function julian(year, month, day) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
}

/* Склонение Солнца и уравнение времени на момент jd. */
export function sunPosition(jd) {
  const d = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * d); // средняя аномалия
  const q = fixAngle(280.459 + 0.98564736 * d); // средняя долгота
  const l = fixAngle(q + 1.915 * sin(g) + 0.02 * sin(2 * g)); // эклиптическая долгота
  const e = 23.439 - 0.00000036 * d; // наклон эклиптики
  const ra = fixHour(arctan2(cos(e) * sin(l), cos(l)) / 15); // прямое восхождение, часы
  return { declination: arcsin(sin(e) * sin(l)), equation: q / 15 - ra };
}

/* Полуденный угол: сколько часов от солнечного полудня до момента, когда
   Солнце стоит на высоте −angle. NaN, если такой высоты в этот день нет. */
function hourAngle(angle, latitude, declination) {
  const x = (-sin(angle) - sin(declination) * sin(latitude)) / (cos(declination) * cos(latitude));
  return arccos(x) / 15;
}

/* Аср: тень предмета равна его полуденной тени плюс factor его высот. */
function asrAngle(factor, latitude, declination) {
  return -arccot(factor + tan(Math.abs(latitude - declination)));
}

/* Методы расчёта. Углы — глубина Солнца под горизонтом для фаджра и иши.
   ishaMinutes вместо угла — так считает Умм аль-Кура: фиксированный
   промежуток после магриба. */
export const METHODS = {
  mwl: { name: "Всемирная лига", short: "ВЛИМ", fajr: 18, isha: 17 },
  russia: { name: "Россия, СМР", short: "СМР", fajr: 16, isha: 15 },
  umm: { name: "Умм аль-Кура, Мекка", short: "Мекка", fajr: 18.5, ishaMinutes: 90 },
  egypt: { name: "Египетский центр", short: "Египет", fajr: 19.5, isha: 17.5 },
  karachi: { name: "Карачи", short: "Карачи", fajr: 18, isha: 18 },
  isna: { name: "ISNA, Сев. Америка", short: "ISNA", fajr: 15, isha: 15 },
  turkey: { name: "Диянет, Турция", short: "Диянет", fajr: 18, isha: 17 },
};

/* Что делать, когда астрономической ночи не хватает. Доля ночи, которая
   отводится на промежуток между закатом и ишой (и симметрично для фаджра). */
export const HIGH_LAT = {
  angle: { name: "По углу", short: "угол/60" },
  seventh: { name: "Одна седьмая ночи", short: "1/7 ночи" },
  middle: { name: "Половина ночи", short: "1/2 ночи" },
};

function nightPortion(rule, angle, night) {
  if (rule === "seventh") return night / 7;
  if (rule === "middle") return night / 2;
  return (angle / 60) * night; // «по углу»: градус даёт минуту
}

export const PRAYER_KEYS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

export const PRAYER_NAMES = {
  fajr: "Фаджр",
  sunrise: "Восход",
  dhuhr: "Зухр",
  asr: "Аср",
  maghrib: "Магриб",
  isha: "Иша",
};

/* Подписи, чтобы человеку было понятно, что за момент отмечен. */
export const PRAYER_HINTS = {
  fajr: "рассветный",
  sunrise: "конец времени фаджра",
  dhuhr: "полуденный",
  asr: "предвечерний",
  maghrib: "закатный",
  isha: "ночной",
};

/* Смещение часового пояса площадки в минутах на конкретный момент.
   Через Intl, поэтому переход на летнее время учитывается сам. */
export function tzOffsetMinutes(timeZone, date) {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const p = {};
    for (const part of dtf.formatToParts(date)) p[part.type] = part.value;
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return Math.round((asUTC - date.getTime()) / 60000);
  } catch {
    return -date.getTimezoneOffset();
  }
}

/* Основной расчёт.
   date — гражданская дата площадки (год, месяц 1-12, день).
   Возвращает часы от местной полуночи, дробные. */
export function computeTimes({
  date,
  latitude,
  longitude,
  timezoneMinutes,
  method = "mwl",
  asrFactor = 1,
  highLat = "angle",
  _fallback = false,
}) {
  const m = METHODS[method] || METHODS.mwl;
  const tz = timezoneMinutes / 60;
  const jd = julian(date.year, date.month, date.day) - longitude / (15 * 24);
  const { declination: decl, equation: eqt } = sunPosition(jd);

  const dhuhr = 12 - eqt + tz - longitude / 15;
  const at = (angle) => hourAngle(angle, latitude, decl);

  const sunriseSpan = at(0.833); // рефракция плюс видимый радиус диска

  /* За полярным кругом солнце в июне не садится, а в декабре не встаёт:
     восхода и заката нет физически, и формула честно возвращает NaN.
     Молиться при этом всё равно надо. Общепринятое решение — «акраб
     аль-биляд», ближайшая местность, где сутки ещё делятся на день и ночь:
     считаем расписание для 48-й широты, оставив свою долготу и свой пояс.
     Все времена помечаются расчётными, чтобы никто не принял их за
     астрономию. */
  if (!Number.isFinite(sunriseSpan) && !_fallback) {
    const res = computeTimes({
      date,
      latitude: Math.sign(latitude) * 48,
      longitude,
      timezoneMinutes,
      method,
      asrFactor,
      highLat,
      _fallback: true,
    });
    return {
      ...res,
      polar: true,
      estimated: { fajr: true, sunrise: true, dhuhr: false, asr: true, maghrib: true, isha: true },
    };
  }

  const sunrise = dhuhr - sunriseSpan;
  const maghrib = dhuhr + sunriseSpan;
  const asr = dhuhr + hourAngle(asrAngle(asrFactor, latitude, decl), latitude, decl);

  // Длина ночи от заката до восхода следующего дня — опора для высоких широт
  const night = 24 - 2 * sunriseSpan;

  const estimated = { fajr: false, isha: false };

  let fajr = dhuhr - at(m.fajr);
  const fajrLimit = nightPortion(highLat, m.fajr, night);
  if (!Number.isFinite(fajr) || sunrise - fajr > fajrLimit) {
    fajr = sunrise - fajrLimit;
    estimated.fajr = true;
  }

  let isha;
  if (m.ishaMinutes) {
    isha = maghrib + m.ishaMinutes / 60;
  } else {
    isha = dhuhr + at(m.isha);
    const ishaLimit = nightPortion(highLat, m.isha, night);
    if (!Number.isFinite(isha) || isha - maghrib > ishaLimit) {
      isha = maghrib + ishaLimit;
      estimated.isha = true;
    }
  }

  return {
    times: { fajr, sunrise, dhuhr, asr, maghrib, isha },
    estimated,
    polar: false,
    declination: decl,
  };
}

/* Обёртка над computeTimes: берёт место с часовым поясом и обычную Date,
   отдаёт моменты времени как Date плюс пометки о расчётности. */
export function prayerDay(place, when, settings = {}) {
  const tzName = place.tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: tzName,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, mo, d] = dtf.format(when).split("-").map(Number);
  const localMidnightUTC = Date.UTC(y, mo - 1, d);
  const tzMin = tzOffsetMinutes(tzName, new Date(localMidnightUTC + 12 * 3600e3));

  const res = computeTimes({
    date: { year: y, month: mo, day: d },
    latitude: place.lat,
    longitude: place.lon,
    timezoneMinutes: tzMin,
    method: settings.method,
    asrFactor: settings.asrFactor,
    highLat: settings.highLat,
  });

  const adjust = settings.adjust || {};
  const at = {};
  for (const key of PRAYER_KEYS) {
    const hours = res.times[key] + (adjust[key] || 0) / 60;
    at[key] = new Date(localMidnightUTC - tzMin * 60000 + Math.round(hours * 3600e3));
  }
  return { at, estimated: res.estimated, polar: res.polar, date: { year: y, month: mo, day: d }, tz: tzName };
}

/* Какой намаз идёт сейчас и какой следующий. Смотрим в соседние сутки,
   потому что после иши следующий — фаджр уже завтра. */
export function currentAndNext(place, now, settings) {
  const scan = [-1, 0, 1].flatMap((shift) => {
    const day = prayerDay(place, new Date(now.getTime() + shift * 864e5), settings);
    return PRAYER_KEYS.filter((k) => k !== "sunrise").map((key) => ({ key, at: day.at[key] }));
  });
  scan.sort((a, b) => a.at - b.at);
  let current = null;
  let next = null;
  for (const item of scan) {
    if (item.at <= now) current = item;
    else if (!next) next = item;
  }
  return { current, next };
}
