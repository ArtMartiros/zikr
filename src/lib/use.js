import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { subscribe, getState } from "./store.js";

export function useStore() {
  return useSyncExternalStore(subscribe, getState, getState);
}

/* Часы, тикающие ровно так часто, как нужно экрану. Обратный отсчёт до
   намаза без этого замирает, а таймер на каждый компонент — лишние
   перерисовки всего дерева. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    const onVisible = () => document.visibilityState === "visible" && setNow(new Date());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);
  return now;
}

/* Системная кнопка «назад» закрывает шторку, а не выкидывает из
   приложения. Записью в историю занимается ОДИН владелец на всё
   приложение, и вот почему.

   Когда историю вела каждая шторка сама, переход «Настройки → Место»
   ломался: уходящая шторка в размонтировании делала history.back(), а
   пришедшая уже висела на popstate и принимала чужой откат за нажатие
   «назад» — то есть открывалась и тут же закрывалась сама.

   Здесь зависимость — факт открытости, а не то, какая именно шторка
   открыта. Смена одной шторки на другую историю не трогает вовсе. */
export function useSheetHistory(isOpen, onClose) {
  // Держим закрывалку ссылкой: иначе новая функция на каждом рендере
  // перезапускала бы эффект и снова портила историю
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    history.pushState({ sheet: true }, "");
    const onPop = () => onCloseRef.current();
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (history.state?.sheet) history.back();
    };
  }, [isOpen]);
}
