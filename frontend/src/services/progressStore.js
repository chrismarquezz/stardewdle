import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { applyResultToStats, assertValidDate, normalizeStats } from "./progressMath";
import {
  mergeLatestDayProgress,
  normalizeLatestDayProgress,
} from "./latestDayProgress";

export { applyResultToStats, DEFAULT_STATS, normalizeStats } from "./progressMath";

function requireFirestore() {
  if (!db) {
    throw new Error("Cloud progress is not configured for this deployment.");
  }
  return db;
}

function accountRef(database, uid) {
  return doc(database, "users", uid);
}

function dailyResultRef(database, uid, date) {
  return doc(database, "users", uid, "dailyResults", date);
}

function readProgress(profileSnapshot, dailySnapshot, date) {
  if (!profileSnapshot.exists()) {
    if (dailySnapshot.exists()) {
      throw new Error("Daily result exists without its account profile.");
    }
    return null;
  }

  const profile = profileSnapshot.data();
  if (
    typeof profile.accountId !== "string"
    || !/^[0-9a-fA-F-]{36}$/.test(profile.accountId)
    || profile.schemaVersion !== 1
  ) {
    throw new Error("Cloud account profile has an unsupported identity or schema version.");
  }
  if (profile.legacyImportComplete !== true) {
    throw new Error("Account progress migration is incomplete; local statistics were not changed.");
  }

  let dailyResult = null;
  if (dailySnapshot.exists()) {
    dailyResult = dailySnapshot.data();
    if (
      dailyResult.date !== date
      || dailyResult.completed !== true
      || !["win", "loss"].includes(dailyResult.outcome)
      || !Number.isInteger(dailyResult.guessCount)
      || dailyResult.guessCount < 1
      || dailyResult.guessCount > 6
      || (dailyResult.outcome === "loss" && dailyResult.guessCount !== 6)
      || !Number.isInteger(dailyResult.previousStreak)
      || dailyResult.previousStreak < 0
    ) {
      throw new Error("Cloud daily result has an invalid format.");
    }
    if (dailyResult.previousLastPlayedDate !== null) {
      assertValidDate(dailyResult.previousLastPlayedDate);
    }
  }

  return {
    accountId: profile.accountId,
    stats: normalizeStats(profile.stats, date),
    legacyImportComplete: true,
    dailyResult,
    latestDayProgress: normalizeLatestDayProgress(profile.latestDayProgress),
  };
}

export async function getAccountProgress(uid, date) {
  assertValidDate(date);
  const database = requireFirestore();
  const [profileSnapshot, dailySnapshot] = await Promise.all([
    getDoc(accountRef(database, uid)),
    getDoc(dailyResultRef(database, uid, date)),
  ]);

  return readProgress(profileSnapshot, dailySnapshot, date);
}

export async function createInitialProgress(
  uid,
  date,
  initialStats,
  dailyResult,
  latestDayProgress = null
) {
  assertValidDate(date);
  const database = requireFirestore();
  const profile = accountRef(database, uid);
  const day = dailyResultRef(database, uid, date);
  const accountId = crypto.randomUUID();
  const stats = normalizeStats(initialStats, date);

  return runTransaction(database, async (transaction) => {
    const profileSnapshot = await transaction.get(profile);
    if (profileSnapshot.exists()) {
      const dailySnapshot = await transaction.get(day);
      return { ...readProgress(profileSnapshot, dailySnapshot, date), created: false };
    }

    const storedDailyResult = dailyResult
      ? {
          date,
          completed: true,
          outcome: dailyResult.outcome,
          guessCount: dailyResult.guessCount,
          previousStreak: dailyResult.previousStreak,
          previousLastPlayedDate: dailyResult.previousLastPlayedDate,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      : null;

    const profileData = {
      accountId,
      schemaVersion: 1,
      stats,
      legacyImportComplete: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (latestDayProgress) {
      profileData.latestDayProgress = normalizeLatestDayProgress(latestDayProgress);
    }
    transaction.set(profile, profileData);

    if (storedDailyResult) {
      transaction.set(day, storedDailyResult);
    }

    return {
      created: true,
      accountId,
      stats,
      legacyImportComplete: true,
      dailyResult: storedDailyResult,
      latestDayProgress: profileData.latestDayProgress ?? null,
    };
  });
}

export async function recordDailyResult(uid, date, result) {
  assertValidDate(date);
  if (!result || !["win", "loss"].includes(result.outcome)) {
    throw new Error("Daily result must contain a win or loss outcome.");
  }
  if (
    !Number.isInteger(result.guessCount)
    || result.guessCount < 1
    || result.guessCount > 6
    || (result.outcome === "loss" && result.guessCount !== 6)
  ) {
    throw new Error("Daily result contains an invalid guess count.");
  }
  const database = requireFirestore();
  const profile = accountRef(database, uid);
  const day = dailyResultRef(database, uid, date);

  return runTransaction(database, async (transaction) => {
    const profileSnapshot = await transaction.get(profile);
    if (!profileSnapshot.exists()) {
      throw new Error("Account progress has not been initialized.");
    }

    const dailySnapshot = await transaction.get(day);
    const profileData = profileSnapshot.data();
    const latestDayProgress = result.guesses
      ? mergeLatestDayProgress(profileData.latestDayProgress, date, {
          dailyGame: {
            guesses: result.guesses,
            outcome: result.outcome,
            guessCount: result.guessCount,
          },
        })
      : normalizeLatestDayProgress(profileData.latestDayProgress);
    if (dailySnapshot.exists()) {
      const hasCurrentDailyGame = profileData.latestDayProgress?.date === date
        && profileData.latestDayProgress.dailyGame;
      if (
        result.guesses
        && latestDayProgress?.date === date
        && !hasCurrentDailyGame
      ) {
        transaction.update(profile, {
          latestDayProgress,
          updatedAt: serverTimestamp(),
        });
      }
      return {
        recorded: false,
        accountId: profileData.accountId,
        stats: normalizeStats(profileData.stats, date),
        dailyResult: dailySnapshot.data(),
        latestDayProgress,
      };
    }

    const previousStats = normalizeStats(profileData.stats, date);
    const statsAlreadyIncludeResult = previousStats.lastPlayedDate === date;
    const resultIsOutOfOrder = previousStats.lastPlayedDate
      && previousStats.lastPlayedDate > date;
    let nextStats = previousStats;
    if (resultIsOutOfOrder) {
      const bucket = result.outcome === "win" ? String(result.guessCount) : "0";
      nextStats = {
        ...previousStats,
        total: previousStats.total + 1,
        accuracy: {
          ...previousStats.accuracy,
          [bucket]: previousStats.accuracy[bucket] + 1,
        },
      };
      const isPreviousDay = (
        Date.parse(`${previousStats.lastPlayedDate}T00:00:00.000Z`)
        - Date.parse(`${date}T00:00:00.000Z`)
      ) === 86_400_000;
      if (isPreviousDay && result.outcome === "win") {
        nextStats.streak += 1;
      }
    } else if (!statsAlreadyIncludeResult) {
      nextStats = applyResultToStats(previousStats, result, date);
    }

    const importedPreviousStats = result.previousStats
      ? normalizeStats(result.previousStats, date)
      : previousStats;
    const storedDailyResult = {
      date,
      completed: true,
      outcome: result.outcome,
      guessCount: result.guessCount,
      previousStreak: statsAlreadyIncludeResult
        ? importedPreviousStats.streak
        : resultIsOutOfOrder
          ? importedPreviousStats.streak
          : previousStats.streak,
      previousLastPlayedDate: statsAlreadyIncludeResult
        ? importedPreviousStats.lastPlayedDate
        : resultIsOutOfOrder
          ? importedPreviousStats.lastPlayedDate
          : previousStats.lastPlayedDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    transaction.set(day, storedDailyResult);
    transaction.update(profile, {
      stats: nextStats,
      ...(result.guesses && latestDayProgress?.date === date
        ? { latestDayProgress }
        : {}),
      updatedAt: serverTimestamp(),
    });

    return {
      recorded: true,
      accountId: profileData.accountId,
      stats: nextStats,
      dailyResult: storedDailyResult,
      latestDayProgress,
    };
  });
}

export async function saveCompletedMinigames(uid, date, minigames) {
  assertValidDate(date);
  const database = requireFirestore();
  const profile = accountRef(database, uid);

  return runTransaction(database, async (transaction) => {
    const profileSnapshot = await transaction.get(profile);
    if (!profileSnapshot.exists()) {
      throw new Error("Account progress has not been initialized.");
    }

    const profileData = profileSnapshot.data();
    const existing = normalizeLatestDayProgress(profileData.latestDayProgress);
    if (existing?.date > date) {
      return {
        recorded: false,
        accountId: profileData.accountId,
        latestDayProgress: existing,
      };
    }
    if (existing?.date === date && existing.minigames) {
      return {
        recorded: false,
        accountId: profileData.accountId,
        latestDayProgress: existing,
      };
    }

    const latestDayProgress = mergeLatestDayProgress(existing, date, { minigames });
    transaction.update(profile, {
      latestDayProgress,
      updatedAt: serverTimestamp(),
    });

    return {
      recorded: true,
      accountId: profileData.accountId,
      latestDayProgress,
    };
  });
}

export async function undoDailyResult(uid, date, streakOverride = null) {
  assertValidDate(date);
  if (streakOverride !== null && (!Number.isInteger(streakOverride) || streakOverride < 0)) {
    throw new Error("Streak override must be a non-negative integer.");
  }

  const database = requireFirestore();
  const profile = accountRef(database, uid);
  const day = dailyResultRef(database, uid, date);

  return runTransaction(database, async (transaction) => {
    const profileSnapshot = await transaction.get(profile);
    const dailySnapshot = await transaction.get(day);
    const profileData = profileSnapshot.exists() ? profileSnapshot.data() : null;
    const existingLatestDayProgress = normalizeLatestDayProgress(
      profileData?.latestDayProgress
    );
    const latestDayProgress = existingLatestDayProgress?.date === date
      ? mergeLatestDayProgress(existingLatestDayProgress, date, { dailyGame: null })
      : existingLatestDayProgress;
    if (!dailySnapshot.exists()) {
      const latestStateReset = Boolean(
        profileSnapshot.exists()
        && existingLatestDayProgress?.date === date
        && existingLatestDayProgress.dailyGame
      );
      if (latestStateReset) {
        transaction.update(profile, {
          latestDayProgress,
          updatedAt: serverTimestamp(),
        });
      }
      return {
        reset: latestStateReset,
        stats: profileSnapshot.exists()
          ? normalizeStats(profileData.stats, date)
          : null,
        latestDayProgress,
      };
    }
    if (!profileSnapshot.exists()) {
      throw new Error("Daily result exists without its account profile.");
    }

    const currentStats = normalizeStats(profileData.stats, date);
    const result = dailySnapshot.data();
    const accuracyBucket = result.outcome === "win" ? String(result.guessCount) : "0";
    const resultIsOutOfOrder = currentStats.lastPlayedDate
      && currentStats.lastPlayedDate > date;
    if (
      (!resultIsOutOfOrder && currentStats.lastPlayedDate !== date)
      || currentStats.total < 1
      || currentStats.accuracy[accuracyBucket] < 1
    ) {
      throw new Error("Cloud statistics do not contain this result; it cannot be reset safely.");
    }
    const nextStats = {
      ...currentStats,
      streak: resultIsOutOfOrder
        ? currentStats.streak
        : streakOverride ?? result.previousStreak,
      total: currentStats.total - 1,
      lastPlayedDate: resultIsOutOfOrder
        ? currentStats.lastPlayedDate
        : result.previousLastPlayedDate,
      accuracy: {
        ...currentStats.accuracy,
        [accuracyBucket]: currentStats.accuracy[accuracyBucket] - 1,
      },
    };

    transaction.delete(day);
    transaction.update(profile, {
      stats: nextStats,
      latestDayProgress,
      updatedAt: serverTimestamp(),
    });

    return { reset: true, stats: nextStats, latestDayProgress };
  });
}
