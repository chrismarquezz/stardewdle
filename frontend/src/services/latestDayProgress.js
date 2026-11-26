import { assertValidDate } from "./progressMath";

export const MINIGAME_KEYS = ["food", "npc", "minerals", "fish"];

function normalizeGuessList(guesses, maxGuesses, label) {
  if (
    !Array.isArray(guesses)
    || guesses.length < 1
    || guesses.length > maxGuesses
    || guesses.some((guess) => typeof guess !== "string" || guess.length < 1 || guess.length > 100)
  ) {
    throw new Error(`${label} has an invalid guess sequence.`);
  }
  return [...guesses];
}

function normalizeDailyGame(value) {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Latest daily-game progress has an invalid format.");
  }

  const guesses = normalizeGuessList(value.guesses, 6, "Daily-game progress");
  if (
    guesses.some((guess) => !/^(?:[0-9]|[1-6][0-9]|7[01])$/.test(guess))
    || !["win", "loss"].includes(value.outcome)
    || !Number.isInteger(value.guessCount)
    || value.guessCount !== guesses.length
    || (value.outcome === "loss" && guesses.length !== 6)
  ) {
    throw new Error("Latest daily-game progress has an invalid result.");
  }

  return { guesses, outcome: value.outcome, guessCount: value.guessCount };
}

function normalizeMinigame(value, key) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Latest ${key} minigame progress has an invalid format.`);
  }

  const rawGuesses = normalizeGuessList(
    value.guesses,
    key === "fish" ? 26 : 6,
    `${key} minigame`
  );
  const guesses = key === "fish"
    ? rawGuesses.map((letter) => letter.toLowerCase())
    : rawGuesses;
  if (key === "fish" && guesses.some((letter) => !/^[a-z]$/.test(letter))) {
    throw new Error("Fish minigame progress contains an invalid letter guess.");
  }
  if (!["win", "loss"].includes(value.outcome)) {
    throw new Error(`Latest ${key} minigame progress has an invalid result.`);
  }

  return { guesses, outcome: value.outcome };
}

export function normalizeLatestDayProgress(value) {
  if (value === null || value === undefined) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Latest-day progress has an invalid format.");
  }
  if (
    typeof value.date !== "string"
    || !Object.hasOwn(value, "dailyGame")
    || !Object.hasOwn(value, "minigames")
    || Object.keys(value).some((key) => !["date", "dailyGame", "minigames"].includes(key))
  ) {
    throw new Error("Latest-day progress has an invalid shape.");
  }

  assertValidDate(value.date);
  let minigames = null;
  if (value.minigames !== null) {
    if (
      !value.minigames
      || typeof value.minigames !== "object"
      || Array.isArray(value.minigames)
      || MINIGAME_KEYS.some((key) => !Object.hasOwn(value.minigames, key))
      || Object.keys(value.minigames).some((key) => !MINIGAME_KEYS.includes(key))
    ) {
      throw new Error("Latest minigame progress has an invalid shape.");
    }
    minigames = Object.fromEntries(
      MINIGAME_KEYS.map((key) => [key, normalizeMinigame(value.minigames[key], key)])
    );
  }

  return {
    date: value.date,
    dailyGame: normalizeDailyGame(value.dailyGame),
    minigames,
  };
}

export function mergeLatestDayProgress(existing, date, patch) {
  assertValidDate(date);
  if (existing?.date && existing.date > date) {
    return normalizeLatestDayProgress(existing);
  }
  const current = existing?.date === date ? normalizeLatestDayProgress(existing) : null;
  return normalizeLatestDayProgress({
    date,
    dailyGame: Object.hasOwn(patch, "dailyGame")
      ? patch.dailyGame
      : current?.dailyGame ?? null,
    minigames: Object.hasOwn(patch, "minigames")
      ? patch.minigames
      : current?.minigames ?? null,
  });
}

export function serializeDailyGuesses(guesses) {
  if (!Array.isArray(guesses)) {
    throw new Error("Daily-game guesses must be an array.");
  }
  return normalizeGuessList(
    guesses.map((guess) => {
      const cropIndex = Number(guess?.crop?.crop_index);
      if (!Number.isInteger(cropIndex) || cropIndex < 0 || cropIndex > 71) {
        throw new Error("Daily-game guess does not contain a valid crop ID.");
      }
      return String(cropIndex);
    }),
    6,
    "Daily-game progress"
  );
}

export function serializeCompletedMinigames(gameData) {
  if (!gameData || typeof gameData !== "object") return null;
  const isComplete = MINIGAME_KEYS.every((key) =>
    gameData[key]?.complete === true && typeof gameData[key]?.win === "boolean"
  );
  if (!isComplete) return null;

  return Object.fromEntries(
    MINIGAME_KEYS.map((key) => {
      const guesses = normalizeGuessList(
        gameData[key].guesses,
        key === "fish" ? 26 : 6,
        `${key} minigame`
      );
      return [key, {
        guesses: key === "fish" ? guesses.map((letter) => letter.toLowerCase()) : guesses,
        outcome: gameData[key].win ? "win" : "loss",
      }];
    })
  );
}

export function restoreMinigameState(minigames) {
  const normalized = normalizeLatestDayProgress({
    date: "2000-01-01",
    dailyGame: null,
    minigames,
  });
  return {
    ...Object.fromEntries(MINIGAME_KEYS.map((key) => [
      key,
      {
        complete: true,
        win: normalized.minigames[key].outcome === "win",
        guesses: normalized.minigames[key].guesses,
        animationSeen: false,
      },
    ])),
    apiSynced: true,
  };
}
