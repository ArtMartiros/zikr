import { useEffect } from "react";
import { CloseIcon } from "./Icons.jsx";

/* Шторка снизу — единственный способ показать что-то поверх на телефоне,
   не уводя человека с экрана и не ломая счётчик. Закрывается тапом по фону,
   кнопкой и системной «назад»: последнее делается записью в историю, иначе
   на Android жест назад выкидывал бы из приложения целиком. */
export default function Sheet({ title, onClose, children, action }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    history.pushState({ sheet: true }, "");
    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      if (history.state?.sheet) history.back();
    };
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
