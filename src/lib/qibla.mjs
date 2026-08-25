/* Направление на Каабу — начальный азимут ортодромии. Не «посмотри на юг»,
   а именно кратчайший путь по сфере: из Москвы это 176°, из Лондона 119°,
   из Нью-Йорка 58° — на плоской карте такие направления выглядят странно,
   но верны именно они. */

const KAABA = { lat: 21.4225, lon: 39.8262 };
const RAD = Math.PI / 180;

export function qiblaBearing(lat, lon) {
  const dLon = (KAABA.lon - lon) * RAD;
  const p1 = lat * RAD;
  const p2 = KAABA.lat * RAD;
  const y = Math.sin(dLon) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dLon);
  const deg = Math.atan2(y, x) / RAD;
  return (deg + 360) % 360;
}

/* Расстояние до Каабы по большому кругу, километры. */
export function qiblaDistance(lat, lon) {
  const p1 = lat * RAD;
  const p2 = KAABA.lat * RAD;
  const dLat = p2 - p1;
  const dLon = (KAABA.lon - lon) * RAD;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(a)));
}

const SIDES = ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"];

export function compassSide(bearing) {
  return SIDES[Math.round(bearing / 45) % 8];
}
