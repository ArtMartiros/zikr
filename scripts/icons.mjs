/* Растровые иконки собираются из того же public/icon.svg, а не рисуются
   отдельно: иначе ярлык на телефоне рано или поздно разойдётся с иконкой
   в интерфейсе. iOS не понимает svg в apple-touch-icon и не читает
   манифест для ярлыка — отсюда отдельный png под неё.

   Maskable-вариант с полями: Android обрезает иконку под форму системы,
   и звезда без запаса по краям лишилась бы лучей. */

import sharp from "sharp";
import fs from "node:fs";

const svg = fs.readFileSync("public/icon.svg");

const render = (size, file) =>
  sharp(svg, { density: 400 }).resize(size, size).png({ compressionLevel: 9 }).toFile(file);

await render(192, "public/icon-192.png");
await render(512, "public/icon-512.png");
await render(180, "public/apple-touch-icon.png");

// 512 с полем в 12% с каждой стороны: безопасная зона маски — центральные 80%
await sharp(svg, { density: 400 })
  .resize(400, 400)
  .extend({ top: 56, bottom: 56, left: 56, right: 56, background: "#05100D" })
  .png({ compressionLevel: 9 })
  .toFile("public/icon-maskable.png");

console.log("иконки собраны:", fs.readdirSync("public").filter((f) => f.endsWith(".png")).join(", "));
