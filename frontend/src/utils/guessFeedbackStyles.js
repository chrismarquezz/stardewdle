export function getCorrectGuessOverlayClass(theme) {
  const backgroundClass = theme === "dark" ? "bg-green-400" : "bg-cyan-500";
  const blendClass = theme === "dark" ? "mix-blend-overlay" : "mix-blend-multiply";
  return `${backgroundClass} ${blendClass}`;
}

export function getPartialGuessOverlayClass(theme) {
  const backgroundClass = theme === "dark" ? "bg-yellow-100" : "bg-amber-300";
  const blendClass = theme === "dark" ? "mix-blend-overlay" : "mix-blend-multiply";
  return `${backgroundClass} ${blendClass}`;
}

export function getWrongGuessOverlayClass(theme) {
  const blendClass = theme === "dark" ? "mix-blend-overlay" : "mix-blend-multiply";
  return `bg-wrong ${blendClass}`;
}
