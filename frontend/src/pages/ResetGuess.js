import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useSound } from "../context/SoundContext";
import { useResponsiveLayout } from "../hooks/useResponsiveScale";
import { useAuth } from "../context/AuthContext";

import CustomButton from "../components/CustomButton";

const DAY_KEYS = [
  "stardewdle-guesses",
  "stardewdle-gameOver",
  "stardewdle-selectedCrop",
  "stardewdle-hints",
  "stardewdle-manualDisables",
  "stardewdle-disableMode",
];

const DEFAULT_STATS = {
  streak: 0,
  total: 0,
  lastPlayedDate: null,
  accuracy: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;
// Stardewdle's first daily crop; a streak can't be longer than the days played since then.
const LAUNCH_DATE = "2026-06-18";
const PENDING_PROGRESS_KEY = "stardewdle-pendingProgress";
const PENDING_RESET_KEY = "stardewdle-pendingProgressResets";
const CLOUD_COMPLETION_OWNER_KEY = "stardewdle-cloudCompletionOwner";

function readPendingArray(key, label) {
  const raw = localStorage.getItem(key);
  if (!raw) return [];

  let value;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
  if (!Array.isArray(value)) {
    throw new Error(`${label} has an invalid format.`);
  }
  return value;
}

function savePendingArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function maxStreakFor(todayStr) {
  const days = Math.round(
    (new Date(todayStr + "T00:00:00Z") - new Date(LAUNCH_DATE + "T00:00:00Z")) / MS_PER_DAY
  );
  return Math.max(0, days);
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function parseStreak(value, max) {
  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value.trim());
  return parsed <= max ? parsed : null;
}

// Undo the stats entry today's finished game added. Prefers the snapshot written at submit time,
// and falls back to subtracting the data point for games finished before snapshots existed.
function rollbackStats(todayStr) {
  const backup = readJSON("stardewdle-statsBackup", null);
  if (backup?.date === todayStr && backup.stats) {
    localStorage.setItem("stardewdle-stats", JSON.stringify(backup.stats));
    localStorage.removeItem("stardewdle-statsBackup");
    return "restored";
  }

  const stats = { ...DEFAULT_STATS, ...readJSON("stardewdle-stats", DEFAULT_STATS) };
  if (stats.lastPlayedDate !== todayStr) return "nothing-to-undo";

  const guesses = readJSON("stardewdle-guesses", []) || [];
  // Without the snapshot the answer is unknown here, so infer a win from finishing before guess six.
  const won = readJSON("stardewdle-gameOver", false) === true && guesses.length < 6;
  const bucket = won ? guesses.length : 0;

  const accuracy = { ...stats.accuracy };
  accuracy[bucket] = Math.max(0, (accuracy[bucket] || 0) - 1);

  localStorage.setItem(
    "stardewdle-stats",
    JSON.stringify({
      ...stats,
      accuracy,
      total: Math.max(0, stats.total - 1),
      streak: won ? Math.max(0, stats.streak - 1) : stats.streak,
      lastPlayedDate: null,
    })
  );
  localStorage.removeItem("stardewdle-statsBackup");
  return "estimated";
}

export default function ResetGuess() {
  const { isMuted } = useSound();
  const { user, loading: authLoading, setProgressSyncStatus } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { width, height, scaleFactor } = useResponsiveLayout();

  const todayStr = new Date().toISOString().split("T")[0];
  const maxStreak = maxStreakFor(todayStr);
  const [guessCount, setGuessCount] = useState(() => (readJSON("stardewdle-guesses", []) || []).length);
  const [stats, setStats] = useState(() => ({
    ...DEFAULT_STATS,
    ...readJSON("stardewdle-stats", DEFAULT_STATS),
  }));
  const [streakInput, setStreakInput] = useState(
    () => (parseStreak(searchParams.get("streak"), maxStreak) ?? "").toString()
  );
  const [status, setStatus] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const streakOverride = parseStreak(streakInput, maxStreak);
  const streakInvalid = streakInput.trim() !== "" && streakOverride === null;

  const handleReset = async () => {
    const outcome = rollbackStats(todayStr);
    DAY_KEYS.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem("stardewdle-cloudCompletionOwner");

    if (streakOverride !== null) {
      const current = { ...DEFAULT_STATS, ...readJSON("stardewdle-stats", DEFAULT_STATS) };
      localStorage.setItem(
        "stardewdle-stats",
        JSON.stringify({ ...current, streak: streakOverride })
      );
    }

    setGuessCount(0);
    setStats({ ...DEFAULT_STATS, ...readJSON("stardewdle-stats", DEFAULT_STATS) });

    const base =
      outcome === "nothing-to-undo"
        ? "Today's guesses were cleared. No completed game was recorded, so your stats are unchanged."
        : outcome === "restored"
          ? "Today's guesses were cleared and your stats were restored to before today's game."
          : "Today's guesses were cleared and today's result was subtracted from your stats.";

    const localStatus = streakOverride !== null
      ? `${base} Your streak was set to ${streakOverride}.`
      : base;
    setStatus(user ? `${localStatus} Cloud reset is pending...` : localStatus);

    if (!user) return;

    setIsResetting(true);
    setProgressSyncStatus("syncing");
    let resetQueued = false;
    try {
      let pendingResets = readPendingArray(PENDING_RESET_KEY, "Pending cloud resets");
      pendingResets = pendingResets.filter((entry) =>
        entry.uid !== user.uid || entry.date !== todayStr
      );
      pendingResets.push({
        uid: user.uid,
        date: todayStr,
        streakOverride,
      });
      savePendingArray(PENDING_RESET_KEY, pendingResets);
      resetQueued = true;

      const pendingResults = readPendingArray(PENDING_PROGRESS_KEY, "Pending cloud progress")
        .filter((entry) => entry.uid !== user.uid || entry.date !== todayStr);
      savePendingArray(PENDING_PROGRESS_KEY, pendingResults);

      const { undoDailyResult } = await import("../services/progressStore");
      const reset = await undoDailyResult(user.uid, todayStr, streakOverride);
      const remainingResets = readPendingArray(PENDING_RESET_KEY, "Pending cloud resets")
        .filter((entry) => entry.uid !== user.uid || entry.date !== todayStr);
      savePendingArray(PENDING_RESET_KEY, remainingResets);
      localStorage.removeItem(CLOUD_COMPLETION_OWNER_KEY);

      if (reset.reset && reset.stats) {
        localStorage.setItem("stardewdle-stats", JSON.stringify(reset.stats));
        setStats(reset.stats);
      }

      setProgressSyncStatus("synced");
      setStatus(reset.reset
        ? `${localStatus} Cloud progress was also reset.`
        : `${localStatus} No cloud result existed to undo.`);
    } catch (error) {
      setProgressSyncStatus("error", error.message);
      setStatus(
        `${localStatus} Cloud reset failed: ${error.message}.${resetQueued
          ? " It has been queued to retry when the game is reopened."
          : " It could not be queued; please try again when online."}`
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex justify-center items-center">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/background.webp')" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
        }}
      />

      <div
        className="absolute left-1/2 top-1/2 z-10 flex flex-col items-center overflow-y-auto"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(-50%, -50%) scale(${scaleFactor})`,
          transformOrigin: "center center",
        }}
      >
        <CustomButton
          variant="title"
          icon="/images/stardewdleLogo.webp"
          label="Stardewdle Home"
          isMuted={isMuted}
          onClick={() => navigate("/")}
          soundPath={"/sounds/mouseClick.mp3"}
          className="mb-4"
        />

        <div className="bg-[#f5deb3] border-4 border-main p-6 text-main text-center flex flex-col justify-center items-center gap-4 text-5xl">
          <h1 className="text-7xl">Undo Today's Game</h1>
          <p className="">
            This clears your guesses for {todayStr} and removes today's result from your stats, so
            you can play today's crop again from scratch.
          </p>

          <div className="text-4xl bg-white/50 w-1/2 p-4">
            <p>Guesses stored for today: {guessCount}</p>
            <p>Games played: {stats.total}</p>
            <p>Current streak: {stats.streak}</p>
          </div>

          <label className="flex flex-col items-center gap-1">
            <span>What was your previous streak?</span>
            <span className="text-4xl italic">(Default will decrease current by 1)</span>
            <input
              type="number"
              min="0"
              max={maxStreak}
              step="1"
              inputMode="numeric"
              value={streakInput}
              onChange={(e) => setStreakInput(e.target.value)}
              placeholder={stats.streak - 1}
              className="w-[240px] px-3 py-2 text-center text-5xl border-2 border-main bg-white/80"
            />
            {streakInvalid && (
              <span className="text-wrong text-base">
                Enter a whole number between 0 and {maxStreak}.
              </span>
            )}
          </label>

          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={streakInvalid || authLoading || isResetting}
            className={`clickable self-center px-6 py-3 text-5xl bg-main text-white transition-transform duration-200 hover:scale-105 active:scale-95 ${streakInvalid || authLoading || isResetting ? "opacity-40 pointer-events-none" : ""
              }`}
          >
            Reset today's guesses
          </button>

          {status && <p className="text-4xl">{status}</p>}

          <button
            type="button"
            onClick={() => window.location.assign("/game")}
            className="clickable self-center text-5xl underline"
          >
            Back to the game
          </button>
        </div>
      </div>
    </div>
  );
}
