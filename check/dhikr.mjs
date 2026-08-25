/* Данные проверяются не для красоты. Арабский текст и транслитерация —
   это то, что человек будет произносить, и опечатка здесь хуже любого
   бага в вёрстке. Латинская «h» посреди кириллического «ли-Лляh» уже
   пролезала — глазом её не видно, а шрифт подставляет другой начерк.

   Города проверяются на живой расчёт: неверное имя часового пояса не
   падает, а тихо превращается в UTC, и намаз уезжает на часы. */

import { SETS, PHRASES, DEFAULT_SET, findSet, setTotal } from "../src/data/dhikr.js";
import { CITIES, searchCities } from "../src/data/cities.js";
import { prayerDay, PRAYER_KEYS } from "../src/lib/prayer-times.mjs";
import { qiblaBearing } from "../src/lib/qibla.mjs";
import { ok, section, done } from "./lib.mjs";

section("Наборы зикров");
const ids = new Set();
for (const set of SETS) {
  ok(!ids.has(set.id), `идентификатор «${set.id}» встречается один раз`);
  ids.add(set.id);
  ok(set.name && set.name.length < 40, `«${set.id}»: название есть и не разъедет шапку`);
  ok(set.note && set.note.length < 60, `«${set.id}»: подпись есть и короткая`);
  ok(set.steps.length > 0, `«${set.id}»: есть хотя бы один шаг`);
  for (const step of set.steps) {
    ok(Number.isInteger(step.target) && step.target > 0 && step.target <= 9999, `«${set.id}»: цель шага в разумных пределах`);
    ok(PHRASES[step.phrase], `«${set.id}»: фраза «${step.phrase}» есть в справочнике`);
  }
  ok(setTotal(set) > 0, `«${set.id}»: круг не пустой`);
}
ok(findSet(DEFAULT_SET).id === DEFAULT_SET, "набор по умолчанию находится");
ok(findSet("такого-нет").id === SETS[0].id, "неизвестный идентификатор не роняет приложение");

section("Фразы");
const ARABIC = /^[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿\s]+$/;
const LATIN = /[A-Za-z]/;
const CYRILLIC = /[А-Яа-яЁё]/;
for (const [id, p] of Object.entries(PHRASES)) {
  ok(ARABIC.test(p.ar), `«${id}»: арабский текст без посторонних символов`);
  ok(p.ar.includes("َ") || p.ar.includes("ِ") || p.ar.includes("ُ") || p.ar.includes("ْ"),
    `«${id}»: огласовки проставлены`);
  ok(!LATIN.test(p.tr), `«${id}»: в транслитерации «${p.tr}» нет латинских букв`);
  ok(CYRILLIC.test(p.tr), `«${id}»: транслитерация кириллицей`);
  ok(p.ru && p.ru.length > 3, `«${id}»: перевод на месте`);
  // Дальше 64 символов даже самый мелкий из трёх кеглей начнёт резаться
  ok(p.ar.length <= 64, `«${id}»: арабская строка влезает в экран телефона (${p.ar.length})`);
}

section("Города")
const names = new Set();
for (const c of CITIES) {
  ok(!names.has(c.name), `«${c.name}» в списке один раз`);
  names.add(c.name);
  ok(c.lat >= -90 && c.lat <= 90, `«${c.name}»: широта в пределах`);
  ok(c.lon >= -180 && c.lon <= 180, `«${c.name}»: долгота в пределах`);

  // Имя пояса, которого нет, Intl молча заменит на UTC — ловим сравнением
  let valid = true;
  try {
    new Intl.DateTimeFormat("ru-RU", { timeZone: c.tz });
  } catch {
    valid = false;
  }
  ok(valid, `«${c.name}»: часовой пояс «${c.tz}» существует`);

  const day = prayerDay(c, new Date("2025-06-21T10:00:00Z"), {});
  const bad = PRAYER_KEYS.filter((k) => Number.isNaN(day.at[k].getTime()));
  ok(bad.length === 0, `«${c.name}»: расписание считается в самый длинный день`);
  ok(Number.isFinite(qiblaBearing(c.lat, c.lon)), `«${c.name}»: кибла считается`);
}

section("Поиск городов");
ok(searchCities("").length === CITIES.length, "пустой запрос показывает весь список");
ok(searchCities("МОСК").some((c) => c.name === "Москва"), "поиск не зависит от регистра");
ok(searchCities("грозн")[0].name === "Грозный", "поиск по началу слова");
ok(searchCities("щщщ").length === 0, "несуществующий город ничего не находит");

done("Данные");
