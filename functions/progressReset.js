const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ACCURACY_BUCKETS = ["0", "1", "2", "3", "4", "5", "6"];

class ProgressResetError extends Error {}

function isValidDate(value) {
  return typeof value === "string" && DATE_PATTERN.test(value);
}

function validateResetData(stats, dailyResult, latestDayProgress, date) {
  if (
    !stats
    || !Number.isInteger(stats.streak)
    || stats.streak < 0
    || !Number.isInteger(stats.total)
    || stats.total < 0
    || !isValidDate(stats.lastPlayedDate)
    || !stats.accuracy
    || ACCURACY_BUCKETS.some((bucket) =>
      !Number.isInteger(stats.accuracy[bucket]) || stats.accuracy[bucket] < 0
    )
  ) {
    throw new ProgressResetError("Cloud account statistics are invalid; reset was not applied.");
  }
  if (
    !dailyResult
    || dailyResult.date !== date
    || dailyResult.completed !== true
    || !["win", "loss"].includes(dailyResult.outcome)
    || !Number.isInteger(dailyResult.guessCount)
    || dailyResult.guessCount < 1
    || dailyResult.guessCount > 6
    || (dailyResult.outcome === "loss" && dailyResult.guessCount !== 6)
    || !Number.isInteger(dailyResult.previousStreak)
    || dailyResult.previousStreak < 0
    || (
      dailyResult.previousLastPlayedDate !== null
      && !isValidDate(dailyResult.previousLastPlayedDate)
    )
  ) {
    throw new ProgressResetError("Today's cloud result is invalid; reset was not applied.");
  }
  if (
    latestDayProgress !== null
    && latestDayProgress !== undefined
    && (
      typeof latestDayProgress !== "object"
      || Array.isArray(latestDayProgress)
      || !isValidDate(latestDayProgress.date)
      || !Object.hasOwn(latestDayProgress, "dailyGame")
      || !Object.hasOwn(latestDayProgress, "minigames")
    )
  ) {
    throw new ProgressResetError("Latest-day progress is invalid; reset was not applied.");
  }
}

function buildDailyResetUpdate(stats, dailyResult, latestDayProgress, date) {
  const resetDailyGame = latestDayProgress?.date === date
    && latestDayProgress.dailyGame !== null;

  if (!dailyResult) {
    return {
      reset: resetDailyGame,
      stats,
      latestDayProgress: resetDailyGame
        ? { ...latestDayProgress, dailyGame: null }
        : latestDayProgress ?? null,
    };
  }

  validateResetData(stats, dailyResult, latestDayProgress, date);
  const accuracyBucket = dailyResult.outcome === "win"
    ? String(dailyResult.guessCount)
    : "0";
  if (
    stats.lastPlayedDate !== date
    || stats.total < 1
    || stats.accuracy[accuracyBucket] < 1
  ) {
    throw new ProgressResetError(
      "Cloud statistics do not contain today's result; reset was not applied."
    );
  }

  return {
    reset: true,
    stats: {
      ...stats,
      streak: dailyResult.previousStreak,
      total: stats.total - 1,
      lastPlayedDate: dailyResult.previousLastPlayedDate,
      accuracy: {
        ...stats.accuracy,
        [accuracyBucket]: stats.accuracy[accuracyBucket] - 1,
      },
    },
    latestDayProgress: latestDayProgress?.date === date
      ? { ...latestDayProgress, dailyGame: null }
      : latestDayProgress ?? null,
  };
}

module.exports = { buildDailyResetUpdate, ProgressResetError };
