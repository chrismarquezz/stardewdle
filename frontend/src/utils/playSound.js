// Centralizes Audio creation and swallows autoplay-policy rejections consistently.
export function playSound(path) {
  new Audio(path).play().catch(() => { });
}
