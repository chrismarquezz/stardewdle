export const SEASONS = ["spring", "summer", "fall", "winter"];

export const ATTRIBUTE_KEYS = [
  "growth_time",
  "base_price",
  "regrows",
  "type",
  "season",
];

// "all" (and single-string values) are equivalent to listing every season, so normalise before comparing.
export function seasonSet(value) {
  if (value === undefined || value === null) return new Set();
  const seasons = Array.isArray(value) ? value : [value];
  return new Set(seasons.includes("all") ? SEASONS : seasons);
}

export function seasonsEqual(a, b) {
  const guessed = seasonSet(a);
  const correct = seasonSet(b);
  return guessed.size === correct.size && [...guessed].every((s) => correct.has(s));
}

export function attributeMatches(key, guessValue, answerValue) {
  if (key === "season") return seasonsEqual(guessValue, answerValue);
  return guessValue === answerValue;
}

// True when every attribute cell in the guess row would be green.
export function isFullCropMatch(crop, answer) {
  if (!crop || !answer) return false;
  return ATTRIBUTE_KEYS.every((key) => attributeMatches(key, crop[key], answer[key]));
}
