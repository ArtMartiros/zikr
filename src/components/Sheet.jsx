import { useEffect } from "react";
import { CloseIcon } from "./Icons.jsx";

/* Шторка снизу — единственный способ показать что-то поверх на телефоне,
   не уводя человека с экрана и не ломая счётчик. Закрывается тапом по фону,
   кнопкой, клавишей Escape и системной «назад».

   Историю браузера шторка НЕ ведёт: этим занимается useSheetHistory у того,
   кто шторками распоряжается. Когда каждая вела свою запись сама, переход
   «Настройки → Место» открывал вторую шторку и тут же закрывал её чужим
   откатом. */
export default function Sheet({ title, onClose, children, action }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="sheetwrap">
      <div className="scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="grab" />
        <header>
          <h2>{title}</h2>
          {action}
          <button className="iconbtn" onClick={onClose} aria-label="Закрыть">
            <CloseIcon width="21" height="21" />
          </button>
        </header>
        <div className="body">{children}</div>
      </div>
    </div>
  );
}
