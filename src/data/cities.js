/* Города для выбора места без геолокации.

   Нужны по двум причинам. Первая: не всякий готов отдать координаты
   браузеру, а времена намаза без места не посчитать. Вторая: геолокация
   не работает в самолёте и в подвале, а приложение обязано работать всегда.

   Часовой пояс хранится именем IANA, а не числом: тогда переход на летнее
   время учитывается сам, и Лондон летом не съезжает на час. */

export const CITIES = [
  { name: "Москва", lat: 55.7558, lon: 37.6173, tz: "Europe/Moscow" },
  { name: "Санкт-Петербург", lat: 59.9311, lon: 30.3609, tz: "Europe/Moscow" },
  { name: "Казань", lat: 55.7963, lon: 49.1064, tz: "Europe/Moscow" },
  { name: "Уфа", lat: 54.7388, lon: 55.9721, tz: "Asia/Yekaterinburg" },
  { name: "Махачкала", lat: 42.9849, lon: 47.5047, tz: "Europe/Moscow" },
  { name: "Грозный", lat: 43.3169, lon: 45.6981, tz: "Europe/Moscow" },
  { name: "Назрань", lat: 43.2258, lon: 44.7642, tz: "Europe/Moscow" },
  { name: "Нальчик", lat: 43.4981, lon: 43.6189, tz: "Europe/Moscow" },
  { name: "Владикавказ", lat: 43.0367, lon: 44.6678, tz: "Europe/Moscow" },
  { name: "Черкесск", lat: 44.2269, lon: 42.0578, tz: "Europe/Moscow" },
  { name: "Астрахань", lat: 46.3497, lon: 48.0408, tz: "Europe/Astrakhan" },
  { name: "Оренбург", lat: 51.7682, lon: 55.0969, tz: "Asia/Yekaterinburg" },
  { name: "Самара", lat: 53.1959, lon: 50.1002, tz: "Europe/Samara" },
  { name: "Саратов", lat: 51.5336, lon: 46.0343, tz: "Europe/Saratov" },
  { name: "Волгоград", lat: 48.708, lon: 44.5133, tz: "Europe/Volgograd" },
  { name: "Ростов-на-Дону", lat: 47.2357, lon: 39.7015, tz: "Europe/Moscow" },
  { name: "Краснодар", lat: 45.0355, lon: 38.9753, tz: "Europe/Moscow" },
  { name: "Сочи", lat: 43.5855, lon: 39.7231, tz: "Europe/Moscow" },
  { name: "Симферополь", lat: 44.9521, lon: 34.1024, tz: "Europe/Simferopol" },
  { name: "Нижний Новгород", lat: 56.3269, lon: 44.0059, tz: "Europe/Moscow" },
  { name: "Пермь", lat: 58.0105, lon: 56.2502, tz: "Asia/Yekaterinburg" },
  { name: "Екатеринбург", lat: 56.8389, lon: 60.6057, tz: "Asia/Yekaterinburg" },
  { name: "Челябинск", lat: 55.1644, lon: 61.4368, tz: "Asia/Yekaterinburg" },
  { name: "Тюмень", lat: 57.1522, lon: 65.5272, tz: "Asia/Yekaterinburg" },
  { name: "Сургут", lat: 61.254, lon: 73.3962, tz: "Asia/Yekaterinburg" },
  { name: "Омск", lat: 54.9885, lon: 73.3242, tz: "Asia/Omsk" },
  { name: "Новосибирск", lat: 55.0084, lon: 82.9357, tz: "Asia/Novosibirsk" },
  { name: "Красноярск", lat: 56.0153, lon: 92.8932, tz: "Asia/Krasnoyarsk" },
  { name: "Иркутск", lat: 52.2869, lon: 104.3050, tz: "Asia/Irkutsk" },
  { name: "Владивосток", lat: 43.1155, lon: 131.8855, tz: "Asia/Vladivostok" },
  { name: "Калининград", lat: 54.7104, lon: 20.4522, tz: "Europe/Kaliningrad" },

  { name: "Баку", lat: 40.4093, lon: 49.8671, tz: "Asia/Baku" },
  { name: "Ташкент", lat: 41.2995, lon: 69.2401, tz: "Asia/Tashkent" },
  { name: "Самарканд", lat: 39.627, lon: 66.975, tz: "Asia/Samarkand" },
  { name: "Бухара", lat: 39.7747, lon: 64.4286, tz: "Asia/Samarkand" },
  { name: "Алматы", lat: 43.222, lon: 76.8512, tz: "Asia/Almaty" },
  { name: "Астана", lat: 51.1694, lon: 71.4491, tz: "Asia/Almaty" },
  { name: "Шымкент", lat: 42.3417, lon: 69.5901, tz: "Asia/Almaty" },
  { name: "Бишкек", lat: 42.8746, lon: 74.5698, tz: "Asia/Bishkek" },
  { name: "Душанбе", lat: 38.5598, lon: 68.787, tz: "Asia/Dushanbe" },
  { name: "Ашхабад", lat: 37.9601, lon: 58.3261, tz: "Asia/Ashgabat" },
  { name: "Минск", lat: 53.9006, lon: 27.559, tz: "Europe/Minsk" },
  { name: "Тбилиси", lat: 41.7151, lon: 44.8271, tz: "Asia/Tbilisi" },

  { name: "Мекка", lat: 21.4225, lon: 39.8262, tz: "Asia/Riyadh" },
  { name: "Медина", lat: 24.4686, lon: 39.6142, tz: "Asia/Riyadh" },
  { name: "Эр-Рияд", lat: 24.7136, lon: 46.6753, tz: "Asia/Riyadh" },
  { name: "Дубай", lat: 25.2048, lon: 55.2708, tz: "Asia/Dubai" },
  { name: "Доха", lat: 25.2854, lon: 51.531, tz: "Asia/Qatar" },
  { name: "Стамбул", lat: 41.0082, lon: 28.9784, tz: "Europe/Istanbul" },
  { name: "Анкара", lat: 39.9334, lon: 32.8597, tz: "Europe/Istanbul" },
  { name: "Каир", lat: 30.0444, lon: 31.2357, tz: "Africa/Cairo" },
  { name: "Тегеран", lat: 35.6892, lon: 51.389, tz: "Asia/Tehran" },
  { name: "Иерусалим", lat: 31.7683, lon: 35.2137, tz: "Asia/Jerusalem" },
  { name: "Карачи", lat: 24.8607, lon: 67.0011, tz: "Asia/Karachi" },
  { name: "Лахор", lat: 31.5204, lon: 74.3587, tz: "Asia/Karachi" },
  { name: "Дели", lat: 28.6139, lon: 77.209, tz: "Asia/Kolkata" },
  { name: "Дакка", lat: 23.8103, lon: 90.4125, tz: "Asia/Dhaka" },
  { name: "Куала-Лумпур", lat: 3.139, lon: 101.6869, tz: "Asia/Kuala_Lumpur" },
  { name: "Джакарта", lat: -6.2088, lon: 106.8456, tz: "Asia/Jakarta" },

  { name: "Лондон", lat: 51.5074, lon: -0.1278, tz: "Europe/London" },
  { name: "Париж", lat: 48.8566, lon: 2.3522, tz: "Europe/Paris" },
  { name: "Берлин", lat: 52.52, lon: 13.405, tz: "Europe/Berlin" },
  { name: "Нью-Йорк", lat: 40.7128, lon: -74.006, tz: "America/New_York" },
  { name: "Торонто", lat: 43.6532, lon: -79.3832, tz: "America/Toronto" },
];

export const DEFAULT_CITY = CITIES[0];

export function searchCities(query) {
  const q = query.trim().toLowerCase();
  if (!q) return CITIES;
  return CITIES.filter((c) => c.name.toLowerCase().includes(q));
}
