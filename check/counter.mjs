/* Счётчик — единственное, ради чего приложение открывают, и ломается он
   тише всего.

   Здесь уже случилось ровно это: обработчик тапа брал текущий счёт из
   замыкания рендера. При спокойном темпе всё сходилось, а на быстром
   зикре React не успевал перерисоваться между нажатиями, все они читали
   одно и то же число — и девятнадцать тапов давали единицу. На экране это
   выглядит не как ошибка, а как «телефон подтормаживает».

   Поэтому проверка бьёт очередями без единой паузы: столько раз подряд,
   сколько человек за раз точно не нажмёт. */

import { SETS, setTotal, findSet } from "../src/data/dhikr.js";
import { ok, section, done } from "./lib.mjs";

// Хранилища в Node нет, а store без него не заводится
globalThis.localStorage = {
  data: new Map(),
  getItem(k) {
    return this.data.get(k) ?? null;
  },
  setItem(k, v) {
    this.data.set(k, v);
  },
  removeItem(k) {
    this.data.delete(k);
  },
};

const { advanceCounter, retreatCounter, setCounter, getState, resetAll, dayKey, stats } = await import(
  "../src/lib/store.js"
);

const counter = () => getState().counter;
const today = () => getState().days[dayKey()] || { total: 0, bySet: {}, prayers: {} };

section("Очередь тапов без пауз");
resetAll();
const tasbih = findSet("tasbih");
for (let i = 0; i < 19; i++) advanceCounter(tasbih);
ok(counter().count === 19, `девятнадцать тапов подряд дают 19, а не ${counter().count}`);
ok(today().total === 19, `в статистику ушло 19, а не ${today().total}`);

section("Круг закрывается ровно на сумме шагов");
resetAll();
for (let i = 0; i < setTotal(tasbih); i++) advanceCounter(tasbih);
ok(counter().laps === 1, "33 + 33 + 34 = один круг");
ok(counter().step === 0 && counter().count === 0, "после круга счётчик в начале");
ok(today().total === 100, "за день засчитано ровно сто произнесений");

section("Переходы между шагами");
resetAll();
for (let i = 0; i < 33; i++) advanceCounter(tasbih);
ok(counter().step === 1 && counter().count === 0, "после 33 — второй шаг с нуля");
for (let i = 0; i < 33; i++) advanceCounter(tasbih);
ok(counter().step === 2 && counter().count === 0, "после ещё 33 — третий шаг");
for (let i = 0; i < 33; i++) advanceCounter(tasbih);
ok(counter().step === 2 && counter().count === 33, "третий шаг длиннее: 34, а не 33");
advanceCounter(tasbih);
ok(counter().laps === 1, "тридцать четвёртое произнесение закрывает круг");

section("Откат");
resetAll();
for (let i = 0; i < 40; i++) advanceCounter(tasbih);
retreatCounter(tasbih);
ok(counter().step === 1 && counter().count === 6, "откат внутри шага снимает одно");
// шесть откатов доводят второй шаг до нуля, седьмой переводит в первый
for (let i = 0; i < 6; i++) retreatCounter(tasbih);
ok(counter().step === 1 && counter().count === 0, "откаты доводят шаг до нуля, не перескакивая через него");
retreatCounter(tasbih);
ok(counter().step === 0 && counter().count === 32, "на границе шага откат уходит в конец предыдущего");
ok(today().total === 32, `статистика откатилась вместе со счётчиком (${today().total})`);

resetAll();
ok(retreatCounter(tasbih) === false, "откат на пустом счётчике ничего не делает");
ok(counter().count === 0 && counter().laps === 0, "и ничего не портит");
ok(today().total === 0, "и не уводит дневной итог в минус");

section("Откат снимает закрытый круг");
resetAll();
for (let i = 0; i < 100; i++) advanceCounter(tasbih);
retreatCounter(tasbih);
ok(counter().laps === 0, "круг снят");
ok(counter().step === 2 && counter().count === 33, "и счётчик вернулся на последнее произнесение");

section("Наборы из одного шага");
resetAll();
const istighfar = findSet("istighfar");
for (let i = 0; i < 250; i++) advanceCounter(istighfar);
ok(counter().laps === 2 && counter().count === 50, "250 из ста — два круга и полсотни сверху");

section("Составной набор из двух шагов");
resetAll();
const beloved = findSet("beloved");
for (let i = 0; i < 200; i++) advanceCounter(beloved);
ok(counter().laps === 1, "две сотни закрывают круг «двух лёгких фраз»");

section("Каждый набор считается отдельно");
resetAll();
for (let i = 0; i < 10; i++) advanceCounter(tasbih);
for (let i = 0; i < 7; i++) advanceCounter(istighfar);
ok(today().bySet.tasbih === 10 && today().bySet.istighfar === 7, "итоги по наборам не смешались");
ok(today().total === 17, "общий итог — сумма");

section("Смена набора не роняет счётчик");
resetAll();
for (let i = 0; i < 50; i++) advanceCounter(tasbih);
setCounter({ setId: "istighfar", step: 0, count: 0, laps: 0 });
advanceCounter(istighfar);
ok(counter().count === 1, "новый набор начинается с единицы");
ok(today().total === 51, "но уже сказанное из истории не пропадает");

section("Шаг за пределами набора не ломает переход");
resetAll();
setCounter({ setId: "istighfar", step: 5, count: 0, laps: 0 }); // у набора один шаг
advanceCounter(istighfar);
ok(counter().count === 1, "лишний индекс шага прижимается к существующему");

section("Серия дней");
resetAll();
for (let i = 0; i < 5; i++) advanceCounter(tasbih);
ok(stats(getState().days).streak === 1, "первый активный день даёт серию в один день");
ok(stats(getState().days).allTime === 5, "всего за всё время — пять");

section("Все наборы проходят полный круг");
for (const set of SETS) {
  resetAll();
  for (let i = 0; i < setTotal(set); i++) advanceCounter(set);
  ok(counter().laps === 1, `«${set.name}»: круг закрывается на ${setTotal(set)}`);
  ok(counter().count === 0 && counter().step === 0, `«${set.name}»: и счётчик обнулён`);
}

done("Счётчик");
