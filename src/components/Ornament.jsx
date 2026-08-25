/* Фон: восьмиконечная звезда (руб-эль-хизб) сеткой. Рисуется одним
   <pattern>, поэтому стоит несколько сотен байт и красится переменной
   темы — в светлой теме тот же узор становится тёмным сам.

   Звёзды стоят и в углах плитки, и в центре: тогда орнамент сходится
   на стыках и не видно, где кончается один тайл и начинается другой. */

/* Шестнадцать вершин: восемь на внешнем радиусе, восемь на внутреннем.
   Отношение 0.46 даёт острые лучи; при 0.7 звезда заплывает и на фоне
   читается ромбом, а не звездой. */
const STAR = (cx, cy, r) => {
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI / 8) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.46;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
};

export default function Ornament() {
  const T = 72;
  const r = 17.5;
  return (
    <svg aria-hidden="true">
      <defs>
        <pattern id="girih" width={T} height={T} patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="0.9">
            <polygon points={STAR(0, 0, r)} />
            <polygon points={STAR(T, 0, r)} />
            <polygon points={STAR(0, T, r)} />
            <polygon points={STAR(T, T, r)} />
            <polygon points={STAR(T / 2, T / 2, r)} />
            <circle cx={T / 2} cy={T / 2} r={r * 0.46} />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#girih)" />
    </svg>
  );
}
