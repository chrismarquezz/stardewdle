const ACCURACY_BUCKETS = ["0", "1", "2", "3", "4", "5", "6"];
const UTC_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_STATS = Object.freeze({
  streak: 0,
  total: 0,
  lastPlayedDate: null,
  accuracy: Object.freeze({
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  }),
});

export function assertValidDate(date) {
  const parsedDate = typeof date === "string"
    ? new Date(`${date}T00:00:00.000Z`)
    : null;
  if (
    typeof date !== "string"
    || !UTC_DATE_PATTERN.test(date)
    || Number.isNaN(parsedDate?.getTime())
    || parsedDate.toISOString().slice(0, 10) !== date
  ) {
    throw new Error("Progress dates must be valid UTC dates in YYYY-MM-DD format.");
  }
}

function dateDifferenceInDays(fromDate, toDate) {
  return Math.round(
    (Date.parse(`${toDate}T00:00:00.000Z`) - Date.parse(`${fromDate}T00:00:00.000Z`))
      / 86_400_000
  );
}

export function normalizeStats(value, today) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Saved player statistics have an invalid format.");
  }

  const savedAccuracy = value.accuracy
    && typeof value.accuracy === "object"
    && !Array.isArray(value.accuracy)
    ? value.accuracy
    : {};
  const accuracy = Object.fromEntries(
    ACCURACY_BUCKETS.map((bucket) => [
      bucket,
      savedAccuracy[bucket] ?? DEFAULT_STATS.accuracy[bucket],
    ])
  );
  const stats = {
    streak: value.streak,
    total: value.total,
    lastPlayedDate: value.lastPlayedDate ?? null,
    accuracy,
  };

  if (!Number.isInteger(stats.streak) || stats.streak < 0) {
    throw new Error("Saved player streak must be a non-negative integer.");
  }
  if (!Number.isInteger(stats.total) || stats.total < 0) {
    throw new Error("Saved player total must be a non-negative integer.");
  }
  if (
    stats.lastPlayedDate !== null
    && (typeof stats.lastPlayedDate !== "string"
      || !UTC_DATE_PATTERN.test(stats.lastPlayedDate))
  ) {
    throw new Error("Saved last-played date is invalid.");
  }
  if (stats.lastPlayedDate !== null) assertValidDate(stats.lastPlayedDate);

  for (const bucket of ACCURACY_BUCKETS) {
    if (!Number.isInteger(accuracy[bucket]) || accuracy[bucket] < 0) {
      throw new Error(`Saved accuracy bucket ${bucket} is invalid.`);
    }
  }

  if (today) {
    assertValidDate(today);
    if (
      stats.lastPlayedDate
      && dateDifferenceInDays(stats.lastPlayedDate, today) > 1
    ) {
      stats.streak = 0;
    }
  }

  return stats;
}

export function applyResultToStats(value, result, date) {
  assertValidDate(date);
  if (!result || !["win", "loss"].includes(result.outcome)) {
    throw new Error("Daily result must contain a win or loss outcome.");
  }
  if (!Number.isInteger(result.guessCount) || result.guessCount < 1 || result.guessCount > 6) {
    throw new Error("Daily result guess count must be between 1 and 6.");
  }
  if (result.outcome === "loss" && result.guessCount !== 6) {
    throw new Error("A loss must use all six guesses.");
  }

  const stats = normalizeStats(value, date);
  if (stats.lastPlayedDate === date) {
    throw new Error("Player statistics already include this UTC day's result.");
  }

  const bucket = result.outcome === "win" ? result.guessCount : 0;
  const previousDateGap = stats.lastPlayedDate
    ? dateDifferenceInDays(stats.lastPlayedDate, date)
    : null;

  return {
    streak: result.outcome === "win"
      ? previousDateGap === 1 ? stats.streak + 1 : 1
      : 0,
    total: stats.total + 1,
    lastPlayedDate: date,
    accuracy: {
      ...stats.accuracy,
      [bucket]: stats.accuracy[bucket] + 1,
    },
  };
}
