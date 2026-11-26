import { isFullCropMatch } from "../utils/cropCompare";
import {
  applyResultToStats,
  DEFAULT_STATS,
  normalizeStats,
} from "./progressMath";
import {
  createInitialProgress,
  getAccountProgress,
} from "./progressStore";
import {
  serializeDailyGuesses,
  serializeCompletedMinigames,
} from "./latestDayProgress";

function readLocalJSON(key, fallback) {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Local progress value "${key}" is invalid JSON: ${error.message}`);
  }
}

export function getLocalCompletedResult(correctCrop, today, uid) {
  if (localStorage.getItem("stardewdle-gameOver") !== "true") return null;

  const completionOwner = readLocalJSON("stardewdle-cloudCompletionOwner", null);
  if (
    completionOwner?.date === today
    && completionOwner.uid
    && completionOwner.uid !== uid
  ) {
    return null;
  }

  if (!correctCrop) {
    throw new Error("Today's answer is not loaded, so local completion cannot be imported yet.");
  }

  const guesses = readLocalJSON("stardewdle-guesses", null);
  if (!Array.isArray(guesses) || guesses.length < 1 || guesses.length > 6) {
    throw new Error("Today's completed game has no valid guesses to identify its outcome.");
  }

  const won = isFullCropMatch(guesses[guesses.length - 1]?.crop, correctCrop);
  if (!won && guesses.length !== 6) {
    throw new Error("Today's completed game has an inconsistent loss state.");
  }

  return {
    outcome: won ? "win" : "loss",
    guessCount: won ? guesses.length : 6,
    guesses: serializeDailyGuesses(guesses),
  };
}

function readDailyResult(today, correctCrop, uid, stats) {
  const result = getLocalCompletedResult(correctCrop, today, uid);
  if (!result) return null;
  const backup = readLocalJSON("stardewdle-statsBackup", null);

  if (backup?.date === today && backup.stats) {
    const previousStats = normalizeStats(backup.stats, today);
    return {
      ...result,
      stats: applyResultToStats(previousStats, result, today),
      previousStreak: previousStats.streak,
      previousLastPlayedDate: previousStats.lastPlayedDate,
    };
  }

  if (stats.lastPlayedDate !== today) {
    return {
      ...result,
      stats: applyResultToStats(stats, result, today),
      previousStreak: stats.streak,
      previousLastPlayedDate: stats.lastPlayedDate,
    };
  }

  return {
    ...result,
    stats,
    previousStreak: result.outcome === "win"
      ? Math.max(0, stats.streak - 1)
      : stats.streak,
    previousLastPlayedDate: null,
  };
}

export async function initializeAccountProgress(uid, today, correctCrop) {
  const existing = await getAccountProgress(uid, today);
  if (existing) return { ...existing, created: false };

  const statsOwner = readLocalJSON("stardewdle-cloudStatsOwner", null);
  const belongsToAnotherAccount = statsOwner?.uid && statsOwner.uid !== uid;
  const localStats = belongsToAnotherAccount
    ? DEFAULT_STATS
    : readLocalJSON("stardewdle-stats", DEFAULT_STATS) ?? DEFAULT_STATS;
  const normalizedStats = normalizeStats(localStats, today);
  const dailyResult = readDailyResult(today, correctCrop, uid, normalizedStats);
  const initialStats = dailyResult?.stats ?? normalizedStats;
  const minigameOwner = readLocalJSON("stardewdle-cloudMinigameOwner", null);
  const belongsToAnotherMinigameAccount = (
    minigameOwner?.uid && minigameOwner.uid !== uid
  );
  const minigames = belongsToAnotherMinigameAccount
    ? null
    : serializeCompletedMinigames(readLocalJSON("stardewdle-game-data", null));
  const latestDayProgress = dailyResult || minigames
    ? {
        date: today,
        dailyGame: dailyResult
          ? {
              guesses: dailyResult.guesses,
              outcome: dailyResult.outcome,
              guessCount: dailyResult.guessCount,
            }
          : null,
        minigames,
      }
    : null;

  return createInitialProgress(
    uid,
    today,
    initialStats,
    dailyResult
      ? {
          outcome: dailyResult.outcome,
          guessCount: dailyResult.guessCount,
          previousStreak: dailyResult.previousStreak,
          previousLastPlayedDate: dailyResult.previousLastPlayedDate,
        }
      : null,
    latestDayProgress
  );
}
