import { useEffect, useState, useSyncExternalStore } from "react";
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
