/* Русские числительные и время. Мелочь, из-за которой интерфейс либо
   выглядит сделанным, либо выдаёт себя строкой «2 кругов». */

export function plural(n, one, few, many) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

export function timeAt(date, timeZone) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function dateLong(date, timeZone) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function weekdayShort(date, timeZone) {
  return new Intl.DateTimeFormat("ru-RU", { timeZone, weekday: "short" }).format(date);
}

/* Сколько осталось. До часа — минуты, дальше часы с минутами: секунды в
   ожидании магриба никому не нужны, а дёргающаяся цифра отвлекает. */
export function timeLeft(ms) {
  if (ms <= 0) return "сейчас";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "меньше минуты";
  if (min < 60) return `${min} ${plural(min, "минута", "минуты", "минут")}`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h} ${plural(h, "час", "часа", "часов")}`;
  return `${h} ${plural(h, "час", "часа", "часов")} ${m} мин`;
}

export function bigNumber(n) {
  return new Intl.NumberFormat("ru-RU").format(n);
}
