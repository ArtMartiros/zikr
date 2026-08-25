import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(<App />);

/* Только в сборке: на дев-сервере worker кэшировал бы правки и мешал
   работать. Отказ глотаем молча — офлайн приятен, но приложение без него
   полностью рабочее. */
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + "sw.js").catch(() => {});
  });
}
