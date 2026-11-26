import { useState, useEffect, useRef } from "react";
import { useSound } from "../../context/SoundContext";
import { useTheme } from "../../context/ThemeContext";
import { formatName } from "../../utils/formatString";
import { useGameData } from "../../context/GameDataContext";
import { useAuth } from "../../context/AuthContext";
import { todaysDate, utcDateString } from "../../utils/dateUtils";
import { playSound } from "../../utils/playSound";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useThemedAsset } from "../../hooks/useThemedAsset";
import { useMidnightRefresh } from "../../hooks/useMidnightRefresh";
import { isFullCropMatch, seasonSet } from "../../utils/cropCompare";
import { serializeDailyGuesses } from "../../services/latestDayProgress";

import CropGrid from "./CropGrid";
import GuessGrid from "./GuessGrid";
import CropLoader from "../CropLoader";
import ShareModal from "./ShareModal";
import HelpModal from "./HelpModal";
import UpdatesModal from "../UpdatesModal";
import HintsModal from "./HintsModal";
import CustomButton from "../CustomButton";
import CursorTooltip from "../CursorTooltip";
import AccountMenu from "../auth/AccountMenu";

const DARK_SELECTED_FRAME_BACKGROUND_SCALE = (58 / 41) / (205 / 164);
const PENDING_PROGRESS_KEY = "stardewdle-pendingProgress";
const PENDING_RESET_KEY = "stardewdle-pendingProgressResets";
const CLOUD_STATS_OWNER_KEY = "stardewdle-cloudStatsOwner";
const CLOUD_COMPLETION_OWNER_KEY = "stardewdle-cloudCompletionOwner";

function readPendingProgress() {
  const raw = localStorage.getItem(PENDING_PROGRESS_KEY);
  if (!raw) return [];

  let pending;
  try {
    pending = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Pending cloud progress is invalid JSON: ${error.message}`);
  }
  if (!Array.isArray(pending)) {
    throw new Error("Pending cloud progress has an invalid format.");
  }
  return pending;
}

function savePendingProgress(pending) {
  localStorage.setItem(PENDING_PROGRESS_KEY, JSON.stringify(pending));
}

function readPendingResets() {
  const raw = localStorage.getItem(PENDING_RESET_KEY);
  if (!raw) return [];

  let pending;
  try {
    pending = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Pending cloud resets are invalid JSON: ${error.message}`);
  }
  if (!Array.isArray(pending)) {
    throw new Error("Pending cloud resets have an invalid format.");
  }
  return pending;
}

function savePendingResets(pending) {
  localStorage.setItem(PENDING_RESET_KEY, JSON.stringify(pending));
}

function saveLocalDayBackup(uid, date) {
  const key = `stardewdle-local-day-${uid}-${date}`;
  if (localStorage.getItem(key)) return;

  const dayState = Object.fromEntries(
    ["stardewdle-guesses", "stardewdle-gameOver", "stardewdle-selectedCrop", "stardewdle-statsBackup"]
      .map((stateKey) => [stateKey, localStorage.getItem(stateKey)])
  );
  localStorage.setItem(key, JSON.stringify(dayState));
}

export default function GameBox({ isMobilePortrait }) {
  const {
    crops,
    dailyData,
    isReady,
    loadError,
    reloadGameData,
    showUpdates,
    setShowUpdates,
    shouldPulse,
    handleOpenUpdates
  } = useGameData();

  const { isMuted, toggleMute } = useSound();
  const {
    user,
    loading: authLoading,
    syncRetryToken,
    setAccountId,
    setProgressSyncStatus,
  } = useAuth();
  const previousUserId = useRef(user?.uid ?? null);
  const { theme, toggleTheme } = useTheme();
  const boxBackground = useThemedAsset(`/images/game/box-bg${isMobilePortrait ? "-sm" : ""}.webp`, theme);
  const guessBackground = useThemedAsset(`/images/game/guesses.webp`, theme);
  const selectedImage = useThemedAsset(`/images/selected-frame.webp`, theme);
  const nameBannerImage = useThemedAsset(`/images/name-banner.webp`, theme);

  const correctCrop = dailyData?.correctCrop;

  const todayStr = utcDateString();

  const [selectedCrop, setSelectedCrop] = useLocalStorage(
    "stardewdle-selectedCrop",
    () => null
  );

  const [guesses, setGuesses] = useLocalStorage(
    "stardewdle-guesses",
    () => []
  );

  const [gameOver, setGameOver] = useLocalStorage(
    "stardewdle-gameOver",
    () => false
  );
  const [progressUserId, setProgressUserId] = useState(null);
  const [cloudDailyResult, setCloudDailyResult] = useState(null);
  const accountProgressLoading = Boolean(user && progressUserId !== user.uid);

  const [storedStats, setStoredStats] = useLocalStorage(
    "stardewdle-stats",
    () => ({
      streak: 0,
      total: 0,
      lastPlayedDate: null,
      accuracy: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    }),
    (parsed) => {
      const stats = {
        streak: 0,
        total: 0,
        lastPlayedDate: null,
        accuracy: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
        ...parsed,
      };

      if (stats.lastPlayedDate) {
        const lastDate = new Date(stats.lastPlayedDate + "T00:00:00Z");
        const todayDate = new Date(todayStr + "T00:00:00Z");

        const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
          stats.streak = 0;
        }
      }

      return stats;
    }
  );

  const [showHints, setShowHints] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareText, setShareText] = useState("");

  const [selectionOffset, setSelectionOffset] = useState(0);
  useEffect(() => {
    setSelectionOffset(parseInt(selectedCrop?.crop_index) / 71 * 100);
  }, [selectedCrop]);

  const [hints, setHints] = useLocalStorage(
    "stardewdle-hints",
    () => ({ growth_time: false, base_price: false, regrows: false, type: false, season: false })
  );

  const [manualDisables, setManualDisables] = useLocalStorage(
    "stardewdle-manualDisables",
    () => []
  );
  const [disableMode, setDisableMode] = useLocalStorage(
    "stardewdle-disableMode",
    () => false
  );

  useEffect(() => {
    if (user?.uid) {
      previousUserId.current = user.uid;
      return;
    }
    if (!previousUserId.current) return;

    try {
      const savedStats = localStorage.getItem("stardewdle-stats");
      const savedGuesses = localStorage.getItem("stardewdle-guesses");
      const savedCrop = localStorage.getItem("stardewdle-selectedCrop");
      setStoredStats(savedStats
        ? JSON.parse(savedStats)
        : {
            streak: 0,
            total: 0,
            lastPlayedDate: null,
            accuracy: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
          });
      setGuesses(savedGuesses ? JSON.parse(savedGuesses) : []);
      setSelectedCrop(savedCrop ? JSON.parse(savedCrop) : null);
      setGameOver(localStorage.getItem("stardewdle-gameOver") === "true");
      previousUserId.current = null;
    } catch (error) {
      setProgressSyncStatus("error", `Local guest progress could not be restored: ${error.message}`);
    }
  }, [
    setGameOver,
    setGuesses,
    setProgressSyncStatus,
    setSelectedCrop,
    setStoredStats,
    user?.uid,
  ]);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!user) {
      setProgressUserId(null);
      setCloudDailyResult(null);
      return undefined;
    }
    if (!isReady || !correctCrop) return undefined;

    let active = true;
    setProgressUserId(null);
    setProgressSyncStatus("syncing");

    const synchronizeProgress = async () => {
      let syncStage = "initialize account progress";
      try {
        const [
          { initializeAccountProgress, getLocalCompletedResult },
          { recordDailyResult, undoDailyResult },
        ] = await Promise.all([
          import("../../services/progressMigration"),
          import("../../services/progressStore"),
        ]);
        let progress = await initializeAccountProgress(user.uid, todayStr, correctCrop);
        if (active) setAccountId(progress.accountId);
        let pendingResets = readPendingResets();
        const accountResets = pendingResets
          .filter((entry) => entry.uid === user.uid && entry.date <= todayStr)
          .sort((left, right) => left.date.localeCompare(right.date));
        let pending = readPendingProgress();
        syncStage = "apply pending daily resets";
        for (const entry of accountResets) {
          const reset = await undoDailyResult(user.uid, entry.date, entry.streakOverride);
          pendingResets = pendingResets.filter((saved) =>
            saved.uid !== entry.uid || saved.date !== entry.date
          );
          savePendingResets(pendingResets);
          pending = pending.filter((saved) =>
            saved.uid !== entry.uid || saved.date !== entry.date
          );
          savePendingProgress(pending);

          if (entry.date === todayStr) {
            progress = {
              ...progress,
              stats: reset.stats ?? progress.stats,
              dailyResult: null,
              latestDayProgress: reset.latestDayProgress,
            };
            localStorage.removeItem(CLOUD_COMPLETION_OWNER_KEY);
            setGameOver(false);
            setGuesses([]);
            setSelectedCrop(null);
            setCloudDailyResult(null);
          }
        }

        const currentStatsOwnerRaw = localStorage.getItem(CLOUD_STATS_OWNER_KEY);
        const currentStatsOwner = currentStatsOwnerRaw
          ? JSON.parse(currentStatsOwnerRaw)
          : null;
        const localStats = localStorage.getItem("stardewdle-stats");
        if (!currentStatsOwner) saveLocalDayBackup(user.uid, todayStr);
        const backupOwnerUid = currentStatsOwner?.uid
          && currentStatsOwner.uid !== user.uid
          ? currentStatsOwner.uid
          : currentStatsOwner?.uid
            ? null
            : user.uid;
        if (localStats && backupOwnerUid) {
          const localStatsBackupKey = `stardewdle-local-stats-${backupOwnerUid}`;
          if (!localStorage.getItem(localStatsBackupKey)) {
            localStorage.setItem(localStatsBackupKey, localStats);
          }
        }

        const accountPending = pending
          .filter((entry) => entry.uid === user.uid && entry.date <= todayStr)
          .sort((left, right) => left.date.localeCompare(right.date));
        syncStage = "sync pending daily results";
        for (const entry of accountPending) {
          if (progress.created && entry.date < todayStr) {
            pending = pending.filter((saved) =>
              saved.uid !== entry.uid || saved.date !== entry.date
            );
            savePendingProgress(pending);
            continue;
          }

          const recorded = await recordDailyResult(user.uid, entry.date, {
            outcome: entry.outcome,
            guessCount: entry.guessCount,
            guesses: entry.guesses,
            previousStats: entry.previousStats,
          });
          progress = {
            ...progress,
            stats: recorded.stats,
            dailyResult: entry.date === todayStr
              ? recorded.dailyResult
              : progress.dailyResult,
            latestDayProgress: entry.date === todayStr
              ? recorded.latestDayProgress
              : progress.latestDayProgress,
          };
          pending = pending.filter((saved) =>
            saved.uid !== entry.uid || saved.date !== entry.date
          );
          savePendingProgress(pending);
        }

        if (!progress.dailyResult) {
          syncStage = "save today's completed game";
          const localResult = getLocalCompletedResult(correctCrop, todayStr, user.uid);
          if (localResult) {
            const recorded = await recordDailyResult(user.uid, todayStr, {
              ...localResult,
              previousStats: progress.stats,
            });
            progress = {
              ...progress,
              stats: recorded.stats,
              dailyResult: recorded.dailyResult,
              latestDayProgress: recorded.latestDayProgress,
            };
          }
        }

        if (!active) return;

        syncStage = "restore saved daily game";
        localStorage.setItem(CLOUD_STATS_OWNER_KEY, JSON.stringify({
          uid: user.uid,
          accountId: progress.accountId,
        }));
        setAccountId(progress.accountId);
        setStoredStats(progress.stats);
        setProgressUserId(user.uid);

        if (progress.dailyResult) {
          const localResult = getLocalCompletedResult(correctCrop, todayStr, user.uid);
          const localMatchesCloud = localResult
            && localResult.outcome === progress.dailyResult.outcome
            && localResult.guessCount === progress.dailyResult.guessCount;
          const cloudDayProgress = progress.latestDayProgress?.date === todayStr
            ? progress.latestDayProgress
            : null;
          const cloudDailyGame = cloudDayProgress?.dailyGame;
          if (
            cloudDailyGame
            && cloudDailyGame.outcome === progress.dailyResult.outcome
            && cloudDailyGame.guessCount === progress.dailyResult.guessCount
          ) {
            const restoredGuesses = cloudDailyGame.guesses.map((cropName) => {
              const crop = crops.find((candidate) => String(candidate.crop_index) === cropName);
              if (!crop) {
                throw new Error(`Saved crop guess "${cropName}" is no longer available.`);
              }
              return { crop };
            });
            setGuesses(restoredGuesses);
            setGameOver(true);
          } else if (!localMatchesCloud) {
            setGuesses([]);
            setSelectedCrop(null);
            setGameOver(true);
          }
          localStorage.setItem(CLOUD_COMPLETION_OWNER_KEY, JSON.stringify({
            uid: user.uid,
            date: todayStr,
          }));
          setCloudDailyResult(progress.dailyResult);
        } else {
          const completionOwner = localStorage.getItem(CLOUD_COMPLETION_OWNER_KEY);
          if (completionOwner) {
            const owner = JSON.parse(completionOwner);
            if (owner.uid !== user.uid || owner.date === todayStr) {
              localStorage.removeItem(CLOUD_COMPLETION_OWNER_KEY);
              setGameOver(false);
              setGuesses([]);
              setSelectedCrop(null);
            }
          }
          setCloudDailyResult(null);
        }

        syncStage = "check for unsent daily results";
        const hasUnsentOlderResult = pending.some((entry) =>
          entry.uid === user.uid && entry.date < todayStr
        );
        if (hasUnsentOlderResult) {
          setProgressSyncStatus(
            "error",
            "A previous day's result is still waiting to sync. It has been kept on this device."
          );
        } else {
          setProgressSyncStatus("synced");
        }
      } catch (error) {
        const message = `${syncStage}: ${error.message || "Account progress could not be loaded."}`;
        console.error(`Failed to sync account progress (${syncStage}):`, error);
        if (active) setProgressSyncStatus("error", message);
      }
    };

    const retryWhenAvailable = () => {
      if (!document.hidden) synchronizeProgress();
    };
    synchronizeProgress();
    window.addEventListener("online", retryWhenAvailable);
    document.addEventListener("visibilitychange", retryWhenAvailable);

    return () => {
      active = false;
      window.removeEventListener("online", retryWhenAvailable);
      document.removeEventListener("visibilitychange", retryWhenAvailable);
    };
  }, [
    authLoading,
    correctCrop,
    crops,
    isReady,
    setAccountId,
    setGameOver,
    setGuesses,
    setProgressSyncStatus,
    setSelectedCrop,
    setStoredStats,
    syncRetryToken,
    todayStr,
    user,
  ]);

  const toggleManualDisable = (crop) => {
    setManualDisables((prev) =>
      prev.includes(crop.name)
        ? prev.filter((name) => name !== crop.name)
        : [...prev, crop.name]
    );
  };

  const syncCompletedResult = async (result, previousStats) => {
    if (!user || progressUserId !== user.uid) return;

    let syncStage = "store the pending daily result";
    try {
      const pending = readPendingProgress().filter((entry) =>
        entry.uid !== user.uid || entry.date !== todayStr
      );
      pending.push({
        uid: user.uid,
        date: todayStr,
        outcome: result.outcome,
        guessCount: result.guessCount,
        guesses: result.guesses,
        previousStats,
      });
      savePendingProgress(pending);
      setProgressSyncStatus("syncing");

      syncStage = "save the completed daily result";
      const { recordDailyResult } = await import("../../services/progressStore");
      const recorded = await recordDailyResult(user.uid, todayStr, {
        ...result,
        previousStats,
      });
      syncStage = "clear the pending daily result";
      const remaining = readPendingProgress().filter((entry) =>
        entry.uid !== user.uid || entry.date !== todayStr
      );
      savePendingProgress(remaining);
      setStoredStats(recorded.stats);
      setAccountId(recorded.accountId);
      setProgressUserId(user.uid);
      setCloudDailyResult(recorded.dailyResult);
      localStorage.setItem(CLOUD_COMPLETION_OWNER_KEY, JSON.stringify({
        uid: user.uid,
        date: todayStr,
      }));
      setProgressSyncStatus("synced");
    } catch (error) {
      const message = `${syncStage}: ${error.message || "The completed game could not be saved."}`;
      console.error(`Failed to save completed game to the account (${syncStage}):`, error);
      setProgressSyncStatus("error", message);
    }
  };

  useMidnightRefresh();

  useEffect(() => {
    const hasSeenHelpModal = localStorage.getItem(
      "stardewdle-hasSeenHelpModal"
    );
    if (!hasSeenHelpModal) {
      setShowHelp(true);
      localStorage.setItem("stardewdle-hasSeenHelpModal", "true");
    }
  }, []);

  useEffect(() => {
    if (gameOver && correctCrop) {
      setSelectedCrop(correctCrop);
    }
  }, [gameOver, correctCrop]);

  useEffect(() => {
    if (!showShareModal || !correctCrop) return;

    function getColor(key, guessValue, correctValue) {
      if (key === "season") {
        const g = seasonSet(guessValue);
        const c = seasonSet(correctValue);
        if (g.size === c.size && [...g].every((s) => c.has(s))) return "🟩";
        return [...g].some((s) => c.has(s)) ? "🟨" : "🟥";
      }
      return guessValue === correctValue ? "🟩" : "🟥";
    }

    const win = isFullCropMatch(guesses[guesses.length - 1]?.crop, correctCrop);
    const header = win ? "I solved today's Stardewdle!" : "I couldn't solve today's Stardewdle.";
    const streak = storedStats.streak > 1 ? `I'm on a ${storedStats.streak} day streak!\n` : ""
    const grid = guesses.map((row) =>
      ["growth_time", "base_price", "regrows", "type", "season"]
        .map((key) => getColor(key, row.crop[key], correctCrop[key]))
        .join("")
    ).join("\n");

    setShareText(`${todaysDate()}\n${header}\n${streak}${grid}\nPlay at: https://stardewdle.com/`);
  }, [showShareModal, guesses, correctCrop, storedStats.streak]);

  const handleSubmit = async () => {
    if (
      !selectedCrop
      || guesses.length >= 6
      || gameOver
      || !correctCrop
      || accountProgressLoading
    ) return;

    const currentDateStr = utcDateString();

    // A stale stored date means the day rolled over, which needs the full new-day storage reset.
    if (localStorage.getItem("stardewdle-date") !== currentDateStr) {
      console.log("Day rolled over on submit, refreshing...");
      window.location.reload();
      return;
    }

    if (correctCrop.date !== currentDateStr) {
      console.log("Stale daily crop detected on submit, reloading game data...");
      reloadGameData();
      return;
    }

    const updatedGuesses = [...guesses, { crop: selectedCrop }];
    setGuesses(updatedGuesses);

    if (!gameOver && updatedGuesses.length < 6) setSelectedCrop(null);

    const isWin = isFullCropMatch(selectedCrop, correctCrop);

    if (!isWin && updatedGuesses.length < 6) {
      if (!isMuted) playSound("/sounds/sell.mp3");
      return;
    }

    const guessCount = isWin ? updatedGuesses.length : 0;

    // Keep a pre-game snapshot for safe stats rollback if needed.
    localStorage.setItem(
      "stardewdle-statsBackup",
      JSON.stringify({ date: currentDateStr, stats: storedStats })
    );

    setStoredStats((prev) => ({
      ...prev,
      lastPlayedDate: currentDateStr,
      streak: isWin ? prev.streak + 1 : 0,
      total: prev.total + 1,
      accuracy: { ...prev.accuracy, [guessCount]: prev.accuracy[guessCount] + 1 },
    }));

    if (!isMuted) playSound(isWin ? "/sounds/reward.mp3" : "/sounds/lose.mp3");

    // Ending the game must not depend on the reporting call succeeding.
    setGameOver(true);
    setShowShareModal(true);
    if (user) {
      void syncCompletedResult({
        outcome: isWin ? "win" : "loss",
        guessCount: isWin ? updatedGuesses.length : 6,
        guesses: serializeDailyGuesses(updatedGuesses),
      }, storedStats);
    }

    try {
      await fetch(import.meta.env.VITE_API_URL + "/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess: selectedCrop.name, guessNum: updatedGuesses.length }),
      });
    } catch (error) {
      console.error("Error submitting guess:", error);
    }
  };

  if (!isReady || !correctCrop || crops.length === 0) {
    return <CropLoader error={loadError} onRetry={() => reloadGameData()} />;
  }

  const spriteStyle = {
    backgroundImage: 'var(--sprite-url)',
    backgroundPosition: `${selectionOffset}% 0%`,
    backgroundSize: '7200% 100%',
    imageRendering: 'pixelated',
    ...(theme === "dark" ? { filter: "brightness(90%)" } : {}),
  };
  const completedOnAnotherDevice = Boolean(cloudDailyResult && guesses.length === 0);

  return (
    <div
      className={`relative shadow-xl bg-no-repeat bg-center flex ${isMobilePortrait
        ? "flex-col-reverse items-center w-full"
        : "flex-row justify-between w-full pl-3 mt-3"
        }`}
      style={{
        backgroundImage: `url(${boxBackground})`,
        backgroundSize: "100% 100%",
        width: isMobilePortrait ? "940px" : "1600px",
        height: isMobilePortrait ? "1500px" : "800px",
      }}
    >
      <div
        className={
          isMobilePortrait
            ? "flex justify-center items-center w-full h-[47%] py-6"
            : "flex justify-center items-center h-full w-[90%] mt-[2px]"
        }
      >
        <CropGrid
          selectedCrop={selectedCrop}
          onSelect={
            !gameOver && guesses.length < 6 && !accountProgressLoading
              ? setSelectedCrop
              : () => { }
          }
          crops={crops}
          isMuted={!gameOver && guesses.length < 6 && !accountProgressLoading ? isMuted : true}
          isMobilePortrait={isMobilePortrait}
          hints={hints}
          guesses={guesses}
          correctCrop={correctCrop}
          disableMode={!gameOver && guesses.length < 6 && !accountProgressLoading ? disableMode : false}
          manualDisables={manualDisables}
          onToggleDisable={
            !gameOver && guesses.length < 6 && !accountProgressLoading
              ? toggleManualDisable
              : () => { }
          }
        />
      </div>

      <div className="flex flex-col align-center w-full place-items-center">
        <div
          className={`flex flex-row items-center h-full gap-4 
            ${theme === "light"
              ? isMobilePortrait ? "mt-20" : "mr-24 mt-[80px]"
              : isMobilePortrait ? "mt-7" : "mr-24 mt-[20px]"}`}
        >
          <div
            className="relative isolate flex items-center justify-center z-20"
            style={{
              width: theme === "light" ? "240px" : "300px",
              height: theme === "light" ? "164px" : "205px",
            }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-center bg-no-repeat bg-contain"
              style={{
                backgroundImage: `url(${selectedImage})`,
                transform:
                  theme === "dark"
                    ? `scale(${DARK_SELECTED_FRAME_BACKGROUND_SCALE})`
                    : undefined,
                transformOrigin: "center",
              }}
            />
            {selectedCrop && (
              <CursorTooltip label={formatName(selectedCrop.name)}>
                <div
                  style={spriteStyle}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[98.4px] w-[98.4px]"
                />
              </CursorTooltip>
            )}
          </div>
          <div className="flex flex-col items-center">
            <div
              className="flex items-center justify-center bg-center bg-no-repeat bg-contain"
              style={{
                backgroundImage: `url(${nameBannerImage})`,
                width: "416px",
                height: "76px",
              }}
            >
              <p
                className={`text-5xl text-center ${theme === "dark" ? "text-alternative-dark" : "text-main"} tracking-wide`}
              >
                {selectedCrop ? formatName(selectedCrop.name) : ""}
              </p>
            </div>
            {gameOver ? (
              <div className="mt-4 flex items-center justify-center gap-4">
                {completedOnAnotherDevice ? (
                  <p className={`text-4xl font-bold whitespace-nowrap ${cloudDailyResult.outcome === "win" ? "text-correct" : "text-wrong"}`}>
                    {cloudDailyResult.outcome === "win"
                      ? "You solved today's game on another device."
                      : "You played today's game on another device."}
                  </p>
                ) : (
                  <>
                    {isFullCropMatch(guesses[guesses.length - 1]?.crop, correctCrop) ? (
                      <p className="text-correct text-5xl font-bold whitespace-nowrap">
                        You guessed it!
                      </p>
                    ) : (
                      <p className="text-wrong text-5xl font-bold whitespace-nowrap">
                        Better luck next time!
                      </p>
                    )}
                    <CustomButton
                      variant="share"
                      icon={"/images/game/share-button.webp"}
                      label={"Share"}
                      soundPath={"/sounds/modal.mp3"}
                      isMuted={isMuted}
                      onClick={() => {
                        setShowShareModal(true);
                      }}
                      isMobilePortrait={isMobilePortrait}
                    />
                  </>
                )}
              </div>
            ) : (
              <CustomButton
                variant="submit"
                icon={"/images/submit-button.webp"}
                label={"Submit"}
                isMuted={true}
                onClick={() => {
                  if (!selectedCrop || guesses.length >= 6 || gameOver) return;
                  handleSubmit();
                }}
                isMobilePortrait={isMobilePortrait}
                className={`${theme === "light" ? "mt-4" : "mt-2 z-10"} 
                  ${!selectedCrop || guesses.length >= 6 || gameOver || accountProgressLoading
                    ? "opacity-40 pointer-events-none"
                    : ""
                  }`
                }
              />
            )}
          </div>
        </div>
        <div
          className={`mb-[84px] min-h-[440px]`}
          style={{
            width: isMobilePortrait ? "750px" : "772px",
            height: "456px",
          }}
        >
          <div
            className={`bg-center bg-no-repeat bg-contain min-h-[440px] flex justify-center items-center absolute
              ${theme === "light"
                ? isMobilePortrait ? "right-[94px]" : "right-[80px]"
                : isMobilePortrait ? "right-[58px] top-[14.5%]" : "right-[12px] bottom-4"}`}
            style={{
              backgroundImage: `url(${guessBackground})`,
              width: theme === "light"
                ? isMobilePortrait ? "750px" : "772px"
                : isMobilePortrait ? "830px" : "880px",
              height: theme === "light" ? "456px" : "540px",
            }}
          >
            <GuessGrid guesses={guesses} answer={correctCrop} isMobilePortrait={isMobilePortrait} />
          </div>
        </div>
      </div>
      <div className={`absolute -top-[58px] md:-top-[55px] ${isMobilePortrait ? "left-8" : theme === "light" ? "left-0" : "left-16"}`}>
        <AccountMenu isMuted={isMuted}/>
      </div>
      <div
        className={`absolute flex gap-[5px] -top-[112px] md:-top-[55px] right-0 ${isMobilePortrait ? "flex-wrap w-[200px]" : theme === "light" ? "" : "right-16"}`}
      >
        <CustomButton
          variant="icon"
          icon="/images/buttons/icons/question-mark.webp"
          label={"Help"}
          isMuted={isMuted}
          onClick={() => {
            setShowHelp(true);
          }}
          showLabel={true}
          isMobilePortrait={isMobilePortrait}
          soundPath={"/sounds/modal.mp3"}
        />

        <CustomButton
          variant="icon"
          icon="/images/buttons/icons/hint.webp"
          showX={!Object.values(hints).some((value) => value)}
          label="View Hints"
          isMuted={isMuted}
          onClick={() => {
            setShowHints(true);
          }}
          showLabel={true}
          isMobilePortrait={isMobilePortrait}
          soundPath={"/sounds/modal.mp3"}
        />

        <CustomButton
          variant="icon"
          icon="/images/buttons/icons/pencil.webp"
          showX={!disableMode}
          label={disableMode ? "Custom Disable: On" : "Custom Disable: Off"}
          isMuted={isMuted}
          onClick={() => {
            setDisableMode((prev) => !prev);
          }}
          showLabel={true}
          isMobilePortrait={isMobilePortrait}
        />

        <CustomButton
          variant="icon"
          icon="/images/buttons/icons/volume.webp"
          showX={isMuted}
          label={isMuted ? "Unmute" : "Mute"}
          isMuted={true}
          onClick={() => {
            if (isMuted) {
              playSound("/sounds/pluck.mp3");
            }
            toggleMute();
          }}
          showLabel={true}
          isMobilePortrait={isMobilePortrait}
        />

        <CustomButton
          variant="icon"
          icon="/images/buttons/icons/theme.webp"
          label={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          isMuted={isMuted}
          onClick={() => {
            toggleTheme();
          }}
          showLabel={true}
          isMobilePortrait={isMobilePortrait}
        />

        <CustomButton
          variant="icon"
          icon="/images/buttons/icons/info.webp"
          label="Updates"
          isMuted={isMuted}
          onClick={handleOpenUpdates}
          shouldPulse={shouldPulse}
          showLabel={true}
          isMobilePortrait={isMobilePortrait}
          soundPath={"/sounds/modal.mp3"}
        />
      </div>

      {showUpdates && (
        <UpdatesModal
          isMuted={isMuted}
          onClose={() => setShowUpdates(false)}
        />
      )}
      {showHelp && (
        <HelpModal isMuted={isMuted} onClose={() => setShowHelp(false)} />
      )}
      {showHints && (
        <HintsModal
          isMuted={isMuted}
          onClose={() => setShowHints(false)}
          setHints={setHints}
          hints={hints}
        />
      )}
      {showShareModal && (
        <ShareModal
          shareText={shareText}
          correctGuesses={dailyData?.stats?.correctGuesses}
          totalGuesses={dailyData?.stats?.totalGuesses}
          onClose={() => setShowShareModal(false)}
          isMuted={isMuted}
          storedStats={storedStats}
        />
      )}
    </div>
  );
}
