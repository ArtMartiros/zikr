/* Отклик на касание: вибрация, щелчок и «не гасить экран».

   Про вибрацию на iPhone. Vibration API там нет и не появится, а зикр без
   отдачи в палец — это не зикр, а тыканье в стекло: приходится смотреть на
   экран, чтобы понять, засчиталось ли. Обходной путь известный: iOS 17.4
   научилась рисовать <input type="checkbox" switch>, и переключение такого
   чекбокса даёт системный тактильный отклик. Держим один скрытый элемент и
   щёлкаем по нему. На Android работает обычный navigator.vibrate. */

let hapticLabel = null;

function iosHapticElement() {
  if (hapticLabel) return hapticLabel;
  const label = document.createElement("label");
  label.setAttribute("aria-hidden", "true");
  label.style.display = "none";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  label.appendChild(input);
  document.head.appendChild(label);
  hapticLabel = label;
  return label;
}

const canVibrate = () => typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

export function haptic(kind = "tick") {
  try {
    if (canVibrate()) {
      navigator.vibrate(kind === "done" ? [14, 40, 26] : kind === "soft" ? 8 : 12);
      return;
    }
    const el = iosHapticElement();
    el.click();
    // Завершение круга отмечаем тройным щелчком — иначе оно неотличимо от обычного
    if (kind === "done") {
      setTimeout(() => el.click(), 90);
      setTimeout(() => el.click(), 180);
    }
  } catch {
    /* без отдачи приложение полностью работоспособно */
  }
}

/* Звук синтезируется, а не берётся файлом: ноль килобайт в бандле и ноль
   запросов в офлайне. Мягкий щелчок — короткий синус с быстрым спадом. */
let audio = null;

function ctx() {
  if (audio) return audio;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  audio = new AC();
  return audio;
}

export function unlockAudio() {
  const c = ctx();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

export function click(kind = "tick") {
  const c = ctx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  const now = c.currentTime;
  const notes = kind === "done" ? [523.25, 659.25, 783.99] : [880];
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const at = now + i * 0.09;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(kind === "done" ? 0.15 : 0.09, at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + (kind === "done" ? 0.32 : 0.09));
    osc.connect(gain).connect(c.destination);
    osc.start(at);
    osc.stop(at + 0.4);
  });
}

/* Экран, гаснущий на сорок седьмом «субханаллах», — главная бытовая беда
   таких приложений. Wake Lock отпускается системой при уходе со вкладки,
   поэтому его приходится брать заново при возвращении. */
let lock = null;

export async function keepAwake(on) {
  try {
    if (!("wakeLock" in navigator)) return false;
    if (on) {
      if (lock) return true;
      lock = await navigator.wakeLock.request("screen");
      lock.addEventListener("release", () => {
        lock = null;
      });
      return true;
    }
    if (lock) {
      await lock.release();
      lock = null;
    }
    return false;
  } catch {
    lock = null;
    return false;
  }
}

export function watchWakeLock(isEnabled) {
  const onVisible = () => {
    if (document.visibilityState === "visible" && isEnabled()) keepAwake(true);
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => document.removeEventListener("visibilitychange", onVisible);
}
