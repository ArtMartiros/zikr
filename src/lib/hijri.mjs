/* Дата по хиджре.

   Основной источник — календарь islamic-umalqura, встроенный в сам браузер
   через Intl. Он совпадает с саудовским Умм аль-Кура день в день: 19 июля
   2023 — 1 мухаррама 1445, 1 марта 2025 — 1 рамадана 1446. Никакой сети и
   никаких таблиц в бандле.

   Запасной путь — табличный (арифметический) календарь по кувейтскому
   алгоритму: работает всегда, но плывёт на день-два. Он и раньше был бы
   «почти правдой», а «почти» в дате Рамадана не годится, поэтому в ход идёт
   только там, где Intl не знает нужного календаря.

   Сутки по хиджре начинаются с закатом, а не в полночь — поэтому после
   магриба дата уже завтрашняя. Это не ошибка расчёта, это так и есть. */

const MONTHS = [
  "мухаррам",
  "сафар",
  "раби уль-авваль",
  "раби уль-ахир",
  "джумада уль-уля",
  "джумада уль-ахира",
  "раджаб",
  "шабан",
  "рамадан",
  "шавваль",
  "зуль-када",
  "зуль-хиджа",
];

const int = Math.floor;

/* Юлианский день (номер суток) по григорианской дате.
   Классическая формула Флигеля — Ван Фландерна написана под целочисленное
   деление с усечением К НУЛЮ, а не вниз. Math.floor вместо этого даёт a = −1
   там, где нужен 0, и вся дата уезжает на двое суток — ошибка тихая, потому
   что календарь всё равно выдаёт правдоподобное число. */
export function gregorianToJD(y, m, d) {
  const a = Math.trunc((m - 14) / 12);
  return (
    int((1461 * (y + 4800 + a)) / 4) +
    int((367 * (m - 2 - 12 * a)) / 12) -
    int((3 * int((y + 4900 + a) / 100)) / 4) +
    d -
    32075
  );
}

export function jdToHijri(jd) {
  let l = jd - 1948440 + 10632;
  const n = int((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j =
    int((10985 - l) / 5316) * int((50 * l) / 17719) + int(l / 5670) * int((43 * l) / 15238);
  l = l - int((30 - j) / 15) * int((17719 * j) / 50) - int(j / 16) * int((15238 * j) / 43) + 29;
  const month = int((24 * l) / 709);
  const day = l - int((709 * month) / 24);
  return { year: 30 * n + j - 30, month, day };
}

let umalquraFormatter;
let umalquraChecked = false;

/* Проверяем не «есть ли Intl», а действительно ли он посчитал по Умм аль-Кура:
   при отсутствии календаря движок молча падает обратно на григорианский, и
   тогда мы получили бы 2025 год вместо 1447. */
function umalqura() {
  if (!umalquraChecked) {
    umalquraChecked = true;
    try {
      const f = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
        timeZone: "UTC",
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
      const probe = {};
      for (const p of f.formatToParts(new Date("2025-06-26T12:00:00Z"))) probe[p.type] = p.value;
      if (+probe.year === 1447 && +probe.month === 1 && +probe.day === 1) umalquraFormatter = f;
    } catch {
      umalquraFormatter = undefined;
    }
  }
  return umalquraFormatter;
}

export function hijriFromJD(jd) {
  const f = umalqura();
  if (f) {
    const ms = (jd - 2440587.5) * 864e5; // номер суток → полдень UTC этих суток
    const p = {};
    for (const part of f.formatToParts(new Date(ms))) p[part.type] = part.value;
    if (+p.year > 1000) return { year: +p.year, month: +p.month, day: +p.day };
  }
  return jdToHijri(jd);
}

/* offset — поправка в днях из настроек (мечети расходятся на день).
   afterSunset — прибавить сутки, потому что новый день начался с магрибом. */
export function hijriOf(date, { offset = 0, timeZone, afterSunset = false } = {}) {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone || undefined,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = dtf.format(date).split("-").map(Number);
  return hijriFromJD(gregorianToJD(y, m, d) + offset + (afterSunset ? 1 : 0));
}

export function hijriMonthName(month) {
  return MONTHS[month - 1] || "";
}

export function formatHijri(h) {
  return `${h.day} ${hijriMonthName(h.month)} ${h.year}`;
}

/* Дни, ради которых календарь в таком приложении и нужен.

   Отобраны по одному признаку: с датой связано конкретное действие —
   пост, ночное стояние, праздничный намаз. Памятные даты, вокруг которых
   расходятся мазхабы, приложение не берётся объявлять за человека. */
export function hijriNote(h) {
  if (h.month === 9 && h.day >= 21) return "Последние десять ночей";
  if (h.month === 9) return "Рамадан";
  if (h.month === 1 && h.day === 10) return "Ашура";
  if (h.month === 10 && h.day <= 3) return "Ид аль-фитр";
  if (h.month === 12 && h.day === 9) return "День Арафата";
  if (h.month === 12 && h.day >= 10 && h.day <= 13) return "Ид аль-адха";
  if (h.month === 8 && h.day === 15) return "Ночь Бараат";
  if (h.month === 7 && h.day === 27) return "Ночь Исра и Мирадж";
  return null;
}
