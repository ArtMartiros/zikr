/* Общая обвязка проверок. Ничего умного: считаем провалы и в конце
   роняем процесс, чтобы CI остановил публикацию. */

let failed = 0;
let passed = 0;

export function ok(condition, what) {
  if (condition) {
    passed++;
    return true;
  }
  failed++;
  console.error("  ✗", what);
  return false;
}

export function near(actual, expected, tolerance, what) {
  const diff = Math.abs(actual - expected);
  return ok(
    diff <= tolerance,
    `${what}: получили ${typeof actual === "number" ? actual.toFixed(2) : actual}, ждали ${expected} ± ${tolerance} (разница ${diff.toFixed(2)})`
  );
}

export function section(name) {
  console.log("·", name);
}

export function done(title) {
  if (failed) {
    console.error(`\n${title}: провалено ${failed} из ${passed + failed}`);
    process.exit(1);
  }
  console.log(`\n${title}: ${passed} проверок пройдено`);
}
