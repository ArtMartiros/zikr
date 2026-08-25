/* Иконки нарисованы здесь, а не взяты библиотекой: их полтора десятка, и
   тащить ради них пакет на сотню килобайт в офлайн-приложение незачем.
   Все — одним росчерком в 24×24, толщина линии общая, поэтому в ряду они
   выглядят как один набор. */

/* Размер задан прямо здесь. SVG без width/height растягивается на всю
   доступную ширину — в строке списка это выглядит не как мелкий недочёт,
   а как сломанный экран: иконка во весь блок и выдавленный текст.
   Явные пропсы у места вызова по-прежнему перекрывают эти значения. */
const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const BeadsIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <circle cx="12" cy="3.8" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="18.2" cy="8.4" r="1.35" fill="currentColor" stroke="none" />
    <circle cx="18.2" cy="15.6" r="1.35" fill="currentColor" stroke="none" />
    <circle cx="12" cy="20.2" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="5.8" cy="15.6" r="1.35" fill="currentColor" stroke="none" />
    <circle cx="5.8" cy="8.4" r="1.35" fill="currentColor" stroke="none" />
  </svg>
);

export const MosqueIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 20v-7.4a8 8 0 0 1 16 0V20" />
    <path d="M2.6 20h18.8" />
    <path d="M12 4.6c1.9 1 2.6 2.1 2.6 3.2a2.6 2.6 0 0 1-5.2 0c0-1.1.7-2.2 2.6-3.2Z" />
    <path d="M12 4.6V2.8" />
    <path d="M9.6 20v-3.4a2.4 2.4 0 0 1 4.8 0V20" />
  </svg>
);

export const ChartIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4.5 20V13" />
    <path d="M9.5 20V4.6" />
    <path d="M14.5 20v-9.6" />
    <path d="M19.5 20V8" />
  </svg>
);

export const GearIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
  </svg>
);

export const CloseIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </svg>
);

export const CheckIcon = (p) => (
  <svg {...base} strokeWidth="2.6" {...p}>
    <path d="M4.5 12.5l5 5 10-11" />
  </svg>
);

export const UndoIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 9.5h10.5a5 5 0 0 1 0 10H8" />
    <path d="M7.5 5.5 3.5 9.5l4 4" />
  </svg>
);

export const ResetIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M20 12a8 8 0 1 1-2.6-5.9" />
    <path d="M20.2 4v4.6h-4.6" />
  </svg>
);

export const ChevronIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M9.5 5.5 16 12l-6.5 6.5" />
  </svg>
);

export const PinIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 21.2s7-5.6 7-11.2a7 7 0 1 0-14 0c0 5.6 7 11.2 7 11.2Z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);

export const CompassIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.6 8.4-1.9 5.3-5.3 1.9 1.9-5.3z" />
  </svg>
);

export const FlameIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 2.8s5.6 4.3 5.6 9.6a5.6 5.6 0 1 1-11.2 0c0-1.9.9-3.6 2-4.9.3 1.2 1 2.1 2 2.4.5-3.2 1.6-5.3 1.6-7.1Z" />
  </svg>
);

export const MoonIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M20 14.2A8.4 8.4 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />
  </svg>
);

export const SunIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.6v2M12 19.4v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.6 12h2M19.4 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </svg>
);

export const PlusIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5.5v13M5.5 12h13" />
  </svg>
);

export const ShareIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 15.5V3.4" />
    <path d="m8.2 7.2 3.8-3.8 3.8 3.8" />
    <path d="M6 11.5H4.6v9h14.8v-9H18" />
  </svg>
);
