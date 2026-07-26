export function vibrate(pattern: number | number[]): void {
  if (typeof navigator === "undefined") return;
  const vibrateFn = navigator.vibrate;
  if (typeof vibrateFn !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw if vibrate is called without user activation,
    // or in cross-origin iframes. Silently ignore.
  }
}
