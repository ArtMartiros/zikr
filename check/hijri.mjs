/* Дата по хиджре — ровно то место, где тихая ошибка обиднее всего:
   календарь выдаёт правдоподобное число, и никто не замечает, что Рамадан
   начался на два дня раньше. Такое здесь уже случилось однажды: формула
   юлианского дня написана под целочисленное деление с усечением к нулю,
   а Math.floor давал −1 вместо 0 и уводил дату на двое суток.

   Поэтому проверяются обе ветки — и встроенный Умм аль-Кура, и запасной
   табличный алгоритм — по опорным датам, которые объявлялись публично. */

import { hijriOf, formatHijri, jdToHijri, gregorianToJD } from "../src/lib/hijri.mjs";
import { ok, near, section, done } from "./lib.mjs";

section("Юлианский день");
ok(gregorianToJD(2000, 1, 1) === 2451545, "1 января 2000 — юлианский день 2451545");
ok(gregorianToJD(2025, 8, 25) === 2460913, "25 августа 2025 — юлианский день 2460913");
ok(gregorianToJD(1970, 1, 1) === 2440588, "начало эпохи Unix — юлианский день 2440588");
ok(gregorianToJD(2024, 2, 29) - gregorianToJD(2024, 2, 28) === 1, "високосное 29 февраля идёт следующим днём");
ok(gregorianToJD(2025, 1, 1) - gregorianToJD(2024, 12, 31) === 1, "смена года не рвёт счёт дней");
for (let m = 1; m <= 12; m++) {
  ok(gregorianToJD(2025, m, 15) > gregorianToJD(2025, m, 14), `месяц ${m}: дни идут по возрастанию`);
}

section("Опорные даты, объявленные публично");
const ANCHORS = [
  ["2023-07-19", 1445, 1, 1, "начало 1445 года"],
  ["2025-03-01", 1446, 9, 1, "первый день Рамадана 1446"],
  ["2025-06-26", 1447, 1, 1, "начало 1447 года"],
  ["2026-02-18", 1447, 9, 1, "первый день Рамадана 1447"],
];
for (const [date, y, m, d, what] of ANCHORS) {
  const h = hijriOf(new Date(date + "T12:00:00Z"), { timeZone: "UTC" });
  ok(
    h.year === y && h.month === m && h.day === d,
    `${what}: ${date} → ждали ${d}/${m}/${y}, получили ${formatHijri(h)}`
  );
  // запасной табличный алгоритм не обязан совпадать день в день, но обязан быть рядом
  const [gy, gm, gd] = date.split("-").map(Number);
  const t = jdToHijri(gregorianToJD(gy, gm, gd));
  const diff = Math.abs((t.year - y) * 354 + (t.month - m) * 29.5 + (t.day - d));
  near(diff, 0, 2, `${what}: табличный запасной вариант рядом (${formatHijri(t)})`);
}

section("Непрерывность");
/* Три года подряд: каждый григорианский день обязан двигать хиджру ровно
   на сутки — ни пропусков, ни повторов на стыке месяцев и годов. */
let prev = null;
let steps = 0;
for (let i = 0; i < 1100; i++) {
  const d = new Date(Date.UTC(2024, 0, 1) + i * 864e5);
  const h = hijriOf(d, { timeZone: "UTC" });
  if (prev) {
    const sameMonth = h.year === prev.year && h.month === prev.month && h.day === prev.day + 1;
    const nextMonth = h.day === 1 && (h.month === prev.month + 1 || (h.month === 1 && prev.month === 12));
    if (!ok(sameMonth || nextMonth, `день ${d.toISOString().slice(0, 10)}: ${formatHijri(prev)} → ${formatHijri(h)}`)) break;
    if (nextMonth) {
      ok(prev.day === 29 || prev.day === 30, `месяц ${prev.month}/${prev.year} длиной 29 или 30 дней, а не ${prev.day}`);
      steps++;
    }
  }
  prev = h;
}
ok(steps > 30, `за три года сменилось больше тридцати месяцев (насчитали ${steps})`);

section("Поправка и закат");
const base = new Date("2025-08-25T12:00:00Z");
const plain = hijriOf(base, { timeZone: "UTC" });
const shifted = hijriOf(base, { timeZone: "UTC", offset: 1 });
ok(shifted.day === plain.day + 1 || shifted.day === 1, "поправка +1 двигает дату на день вперёд");
const evening = hijriOf(base, { timeZone: "UTC", afterSunset: true });
ok(evening.day === plain.day + 1 || evening.day === 1, "после заката наступает следующий день по хиджре");

section("Границы года");
const newYear = hijriOf(new Date("2025-06-26T12:00:00Z"), { timeZone: "UTC" });
const eve = hijriOf(new Date("2025-06-25T12:00:00Z"), { timeZone: "UTC" });
ok(newYear.year === eve.year + 1, "смена года по хиджре происходит ровно один раз");
ok(eve.month === 12, "накануне нового года идёт зуль-хиджа");

done("Хиджра");
