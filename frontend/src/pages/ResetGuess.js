import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useSound } from "../context/SoundContext";

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  const streakOverride = parseStreak(streakInput, maxStreak);
  const streakInvalid = streakInput.trim() !== "" && streakOverride === null;

  const handleReset = () => {
    const outcome = rollbackStats(todayStr);
    DAY_KEYS.forEach((key) => localStorage.removeItem(key));

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

    setStatus(
      streakOverride !== null ? `${base} Your streak was set to ${streakOverride}.` : base
    );
  };

  return (
    <div className="relative min-h-screen w-full overflow-y-auto flex justify-center">
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

      <div className="relative z-10 flex flex-col items-center gap-6 py-10 px-4 max-w-[700px]">
        <CustomButton
          variant="title"
          icon="/images/stardewdleLogo.webp"
          label="Stardewdle Home"
          isMuted={isMuted}
          onClick={() => navigate("/")}
          soundPath={"/sounds/mouseClick.mp3"}
          className="max-w-full"
        />

        <div className="bg-[#f5deb3]/95 border-4 border-[#8b5a2b] rounded-xl p-6 text-main text-center flex flex-col gap-4">
          <h1 className="text-4xl font-bold">Undo Today's Game</h1>
          <p className="text-xl">
            This clears your guesses for {todayStr} and removes today's result from your stats, so
            you can play today's crop again from scratch.
          </p>

          <div className="text-xl">
            <p>Guesses stored for today: {guessCount}</p>
            <p>Games played: {stats.total}</p>
            <p>Current streak: {stats.streak}</p>
          </div>

          <label className="flex flex-col items-center gap-1 text-xl">
            <span>What was your previous streak?</span>
            <input
              type="number"
              min="0"
              max={maxStreak}
              step="1"
              inputMode="numeric"
              value={streakInput}
              onChange={(e) => setStreakInput(e.target.value)}
              placeholder="blank will decrease by 1"
              className="w-[240px] px-3 py-2 text-center text-xl border-2 border-[#8b5a2b] rounded-lg bg-white/80"
            />
            {streakInvalid && (
              <span className="text-wrong text-base">
                Enter a whole number between 0 and {maxStreak}.
              </span>
            )}
          </label>

          <button
            type="button"
            onClick={handleReset}
            disabled={streakInvalid}
            className={`clickable self-center px-6 py-3 text-2xl font-bold bg-[#8b5a2b] text-white rounded-lg transition-transform duration-200 hover:scale-105 active:scale-95 ${streakInvalid ? "opacity-40 pointer-events-none" : ""
              }`}
          >
            Reset today's guesses
          </button>

          {status && <p className="text-xl font-bold">{status}</p>}

          <button
            type="button"
            onClick={() => window.location.assign("/game")}
            className="clickable self-center text-xl underline"
          >
            Back to the game
          </button>
        </div>
      </div>
    </div>
  );
}
