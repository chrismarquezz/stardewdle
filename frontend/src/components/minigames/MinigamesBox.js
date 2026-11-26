import { useState, useEffect } from "react";
import { useSound } from "../../context/SoundContext";
import { useTheme } from "../../context/ThemeContext";
import { useGameData } from "../../context/GameDataContext";
import { todaysDate, utcDateString } from "../../utils/dateUtils";
import { playSound } from "../../utils/playSound";
import { useAuth } from "../../context/AuthContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useMidnightRefresh } from "../../hooks/useMidnightRefresh";
import { useThemedAsset } from "../../hooks/useThemedAsset";

import CookingGame from "./CookingGame";
import FishingGame from "./FishingGame";
import QuotesGame from "./QuotesGame";
import GeologyGame from "./GeologyGame";

import CropLoader from "../CropLoader";
import CustomButton from "../CustomButton";
import HelpModal from "./MinigamesHelp";
import UpdatesModal from "../UpdatesModal";
import MinigamesShareModal from "./MinigamesShareModal";
import BundleButton from "./BundleButton";
import GiftIcon from "./GiftIcon";
import CustomModal from "../CustomModal";
import AccountMenu from "../auth/AccountMenu";
import {
  restoreMinigameState,
  serializeCompletedMinigames,
} from "../../services/latestDayProgress";

const MINIGAME_DATA_KEY = "stardewdle-game-data";
const MINIGAME_OWNER_KEY = "stardewdle-cloudMinigameOwner";

function createDefaultGameData() {
  return {
    food: { complete: false, win: false, guesses: [], animationSeen: false },
    npc: { complete: false, win: false, guesses: [], animationSeen: false },
    minerals: { complete: false, win: false, guesses: [], animationSeen: false },
    fish: { complete: false, win: false, guesses: [], animationSeen: false },
  };
}

const staticGameData = [
  {
    name: "food",
    emoji: "🍳",
    label: "Home Cook's",
    bundleNum: 6,
    pos: "top-[30%] left-[35%]",
    // 5 bundle: pos: "top-[25%] left-[50%]",
  },
  /*{
        name: "map",
        emoji: "🗺️",
        label: "Treasure Hunter's",
        bundleNum: 2,
        imgPath: "treasureHunter",
        // 5 bundle: pos: "top-[50%] left-[25%]",
    },*/
  {
    name: "npc",
    emoji: "🧑‍🤝‍🧑",
    label: "Helper's",
    bundleNum: 3,
    imgPath: "helper",
    pos: "top-[30%] left-[65%]",
    // 5 bundle: pos: "top-[50%] left-[75%]",
  },
  {
    name: "minerals",
    emoji: "⛏️",
    label: "Geologist's",
    bundleNum: 5,
    imgPath: "geologist",
    pos: "top-[70%] left-[25%]",
    // 5 bundle: pos: "top-[75%] left-1/3",
  },
  {
    name: "fish",
    emoji: "🐟",
    label: "Quality Fish",
    bundleNum: 7,
    imgPath: "qualityFish",
    pos: "top-[70%] left-[75%]",
    // 5 bundle: pos: "top-[75%] left-2/3",
  },
];

const bundleGameKeys = staticGameData.map((bundle) => bundle.name);

const HELP_SEEN_KEY = "stardewdle-minigameHelpSeen";

// Key used for the bundle-map help shown before any minigame is selected.
const BASE_HELP = "base";

// Seeds the dictionary from the old per-game `stardewdle-hasSeenMinigame<name>Help` keys.
function migrateLegacyHelpFlags() {
  const seen = {};

  [...bundleGameKeys, ""].forEach((name) => {
    const legacyKey = `stardewdle-hasSeenMinigame${name}Help`;
    if (localStorage.getItem(legacyKey)) {
      seen[name || BASE_HELP] = true;
      localStorage.removeItem(legacyKey);
    }
  });

  return seen;
}

export default function MinigamesBox({ isMobilePortrait, scaleFactor }) {
  const {
    isReady,
    loadError,
    reloadGameData,
    dailyData,
    cooking,
    minerals,
    fish,
    quotes,
    showUpdates,
    setShowUpdates,
    shouldPulse,
    handleOpenUpdates,
  } = useGameData();
  const {
    user,
    loading: authLoading,
    syncRetryToken,
    setAccountId,
    setProgressSyncStatus,
  } = useAuth();

  const { isMuted, toggleMute } = useSound();
  const { theme, toggleTheme } = useTheme();
  const nameBannerBackground = useThemedAsset("/images/name-banner.webp", theme);

  const [showHelp, setShowHelp] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareText, setShareText] = useState("");
  const [progressUserId, setProgressUserId] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [minigameSyncState, setMinigameSyncState] = useState({
    status: "idle",
    error: null,
  });
  const [showMinigameErrorModal, setShowMinigameErrorModal] = useState(false);
  const [errorCopyStatus, setErrorCopyStatus] = useState("");
  const [minigameSyncRetryToken, setMinigameSyncRetryToken] = useState(0);
  const todayStr = utcDateString();

  const [selectedGame, setSelectedGame] = useState("");
  const [selectedGameData, setSelectedGameData] = useState(null);
  const [isGameSelected, setIsGameSelected] = useState(false);
  const mainBackgroundPath = isMobilePortrait
    ? "/images/minigames/mainBG-mobile.webp"
    : selectedGame === "map"
      ? "/images/minigames/mainBG2.webp"
      : "/images/minigames/mainBG.webp";
  const mainBackground = useThemedAsset(mainBackgroundPath, theme);
  const innerBackgroundPath = isMobilePortrait
    ? "/images/minigames/innerBG-mobile.webp"
    : "/images/minigames/innerBG.webp";
  const innerBackground = useThemedAsset(innerBackgroundPath, theme);

  const DARK_CHILD_CONTENT_OFFSET_PX = isMobilePortrait ? 28 : 20;


  const [gameData, setGameData] = useState(() => {
    const saved = localStorage.getItem(MINIGAME_DATA_KEY);
    return saved ? JSON.parse(saved) : createDefaultGameData();
  });

  const allBundlesFinished = bundleGameKeys.every((key) => gameData[key]?.complete);
  const allBundlesSuccessful = bundleGameKeys.every((key) => gameData[key]?.win);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!user) {
      setProgressUserId(null);
      setProgressLoading(false);
      setMinigameSyncState({ status: "idle", error: null });
      setShowMinigameErrorModal(false);
      return undefined;
    }
    if (!isReady || !dailyData?.correctCrop) return undefined;

    let active = true;
    setProgressLoading(true);
    setProgressSyncStatus("syncing");

    const synchronizeMinigames = async () => {
      try {
        const ownerRaw = localStorage.getItem(MINIGAME_OWNER_KEY);
        const currentOwner = ownerRaw ? JSON.parse(ownerRaw) : null;
        if (currentOwner?.uid && currentOwner.uid !== user.uid) {
          throw new Error("Sign out of the other account before syncing minigames.");
        }

        const localStateRaw = localStorage.getItem(MINIGAME_DATA_KEY);
        const localState = localStateRaw
          ? JSON.parse(localStateRaw)
          : createDefaultGameData();
        const backupKey = `stardewdle-local-minigames-${user.uid}-${todayStr}`;
        if (!currentOwner && !localStorage.getItem(backupKey)) {
          localStorage.setItem(backupKey, JSON.stringify(localState));
        }

        const [
          { initializeAccountProgress },
        ] = await Promise.all([
          import("../../services/progressMigration"),
        ]);
        const progress = await initializeAccountProgress(
          user.uid,
          todayStr,
          dailyData.correctCrop
        );
        if (!active) return;

        const latestDayProgress = progress.latestDayProgress?.date === todayStr
          ? progress.latestDayProgress
          : null;
        if (latestDayProgress?.minigames) {
          const restoredState = restoreMinigameState(latestDayProgress.minigames);
          localStorage.setItem(MINIGAME_DATA_KEY, JSON.stringify(restoredState));
          setGameData(restoredState);
          setMinigameSyncState({ status: "synced", error: null });
        } else {
          setMinigameSyncState({ status: "waiting", error: null });
        }

        localStorage.setItem(MINIGAME_OWNER_KEY, JSON.stringify({
          uid: user.uid,
          accountId: progress.accountId,
        }));
        setAccountId(progress.accountId);
        setProgressUserId(user.uid);
        setProgressLoading(false);
        setProgressSyncStatus("synced");
      } catch (error) {
        console.error("Failed to sync minigame progress:", error);
        if (active) {
          setProgressLoading(false);
          setMinigameSyncState({
            status: "error",
            error: error.message || "Account progress could not be loaded.",
          });
          setErrorCopyStatus("");
          setShowMinigameErrorModal(true);
          setProgressSyncStatus("error", error.message);
        }
      }
    };

    const retryWhenAvailable = () => {
      if (!document.hidden) {
        setMinigameSyncRetryToken((current) => current + 1);
        synchronizeMinigames();
      }
    };
    synchronizeMinigames();
    window.addEventListener("online", retryWhenAvailable);
    document.addEventListener("visibilitychange", retryWhenAvailable);

    return () => {
      active = false;
      window.removeEventListener("online", retryWhenAvailable);
      document.removeEventListener("visibilitychange", retryWhenAvailable);
    };
  }, [
    authLoading,
    dailyData?.correctCrop,
    isReady,
    setAccountId,
    setProgressSyncStatus,
    syncRetryToken,
    todayStr,
    user,
  ]);

  useEffect(() => {
    if (!user || progressUserId !== user.uid || !allBundlesFinished) return;

    const minigames = serializeCompletedMinigames(gameData);
    if (!minigames) return;

    let active = true;
    setMinigameSyncState({ status: "syncing", error: null });
    setProgressSyncStatus("syncing");
    const syncCompletedMinigames = async () => {
      try {
        const { saveCompletedMinigames } = await import("../../services/progressStore");
        const result = await saveCompletedMinigames(user.uid, todayStr, minigames);
        if (!active) return;
        setAccountId(result.accountId);
        setProgressUserId(user.uid);
        setMinigameSyncState({ status: "synced", error: null });
        setProgressSyncStatus("synced");
      } catch (error) {
        console.error("Failed to save completed minigames:", error);
        if (active) {
          setMinigameSyncState({
            status: "error",
            error: error.message || "Completed minigames could not be saved.",
          });
          setErrorCopyStatus("");
          setShowMinigameErrorModal(true);
          setProgressSyncStatus("error", error.message);
        }
      }
    };

    syncCompletedMinigames();
    return () => {
      active = false;
    };
  }, [
    allBundlesFinished,
    gameData,
    progressUserId,
    minigameSyncRetryToken,
    setAccountId,
    setProgressSyncStatus,
    todayStr,
    user,
  ]);

  const copyMinigameSyncError = async () => {
    try {
      await navigator.clipboard.writeText(minigameSyncState.error);
      setErrorCopyStatus("Error copied to clipboard.");
    } catch {
      setErrorCopyStatus("Clipboard access failed. Select and copy the error text above.");
    }
  };

  const retryMinigameSync = () => {
    setShowMinigameErrorModal(false);
    setErrorCopyStatus("");
    setMinigameSyncRetryToken((current) => current + 1);
  };

  const [globalBundleStats, setGlobalBundleStats] = useState({
    attempts: 0,
    successes: 0,
  });

  useEffect(() => {
    setGlobalBundleStats({
      attempts: dailyData?.bundleCompletions ?? 0,
      successes: dailyData?.bundleSuccesses ?? 0,
    });
  }, [dailyData?.bundleCompletions, dailyData?.bundleSuccesses]);

  useEffect(() => {
    setSelectedGameData(
      staticGameData.find((item) => item.name === selectedGame) || null,
    );
    setIsGameSelected(selectedGame !== "");
  }, [selectedGame]);

  useEffect(() => {
    if (allBundlesFinished && !gameData.apiSynced) {
      const recordCompletion = async () => {
        try {
          const response = await fetch(
            import.meta.env.VITE_API_URL + "/bundle-complete",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ success: allBundlesSuccessful }),
            },
          );

          if (response.ok) {
            const data = await response.json();
            setGlobalBundleStats({
              attempts: data.newTotal,
              successes: data.newSuccesses ?? 0,
            });

            setGameData((prev) => {
              const updated = { ...prev, apiSynced: true };
              localStorage.setItem(
                MINIGAME_DATA_KEY,
                JSON.stringify(updated),
              );
              return updated;
            });
          }
        } catch (error) {
          console.error("Failed to sync bundle completion:", error);
        }
      };

      recordCompletion();
    }
  }, [allBundlesFinished, allBundlesSuccessful, gameData.apiSynced]);

  useMidnightRefresh();

  const [helpSeen, setHelpSeen] = useLocalStorage(
    HELP_SEEN_KEY,
    migrateLegacyHelpFlags,
    (parsed) =>
      parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null
  );

  useEffect(() => {
    const helpKey = selectedGame || BASE_HELP;
    if (helpSeen[helpKey]) return;
    setShowHelp(true);
    setHelpSeen((prev) => ({ ...prev, [helpKey]: true }));
  }, [selectedGame]);

  const getGameSquares = (gameName) => {
    const guesses = gameData[gameName]?.guesses || [];

    switch (gameName) {
      case "food": {
        const target = cooking?.foods?.[dailyData?.dailyItems?.cooking];
        return guesses
          .map((guess) => (guess === target?.name ? "🟩" : "🟥"))
          .join("");
      }
      case "npc": {
        const target = quotes?.[dailyData?.dailyItems?.villager?.index];
        return guesses
          .map((guess) => (guess === target?.name ? "🟩" : "🟥"))
          .join("");
      }
      case "minerals": {
        const target = minerals?.[dailyData?.dailyItems?.geology];
        return guesses
          .map((guess) => (guess === target?.name ? "🟩" : "🟥"))
          .join("");
      }
      case "fish": {
        const target = fish?.[dailyData?.dailyItems?.fish];
        const targetName =
          target?.name
            ?.replace(/[^a-zA-Z\s]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase() || "";
        return guesses
          .map((letter) => (targetName.includes(letter) ? "🟩" : "🟥"))
          .join("");
      }
      default:
        return "";
    }
  };

  useEffect(() => {
    if (!showShareModal) return;

    const header = allBundlesSuccessful
      ? "I restored today's Community Center!"
      : "I did not get all the Community Center bundles!";

    const grid = staticGameData
      .filter((bundle) => bundle.name !== "map")
      .map(
        (bundle) =>
          `${bundle.emoji} ${bundle.label} Bundle: ${getGameSquares(bundle.name)}`,
      )
      .join("\n");

    setShareText(
      `${todaysDate()}\n${header}\n${grid}\nPlay at: https://stardewdle.com/`,
    );
  }, [showShareModal, gameData, allBundlesSuccessful]);

  const updateGameState = (gameName, newState) => {
    setGameData((prev) => {
      const updated = { ...prev, [gameName]: newState };
      localStorage.setItem(MINIGAME_DATA_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const markAnimationSeen = (gameName) => {
    setGameData((prev) => {
      const updated = {
        ...prev,
        [gameName]: { ...prev[gameName], animationSeen: true },
      };
      localStorage.setItem(MINIGAME_DATA_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const renderMinigame = () => {
    switch (selectedGame) {
      case "food":
        return (
          <CookingGame
            gameState={gameData.food}
            updateGameState={(newState) => updateGameState("food", newState)}
            isMobilePortrait={isMobilePortrait}
            isMuted={isMuted}
          />
        );
      case "fish":
        return (
          <FishingGame
            gameState={gameData.fish}
            updateGameState={(newState) => updateGameState("fish", newState)}
            isMobilePortrait={isMobilePortrait}
            isMuted={isMuted}
          />
        );
      case "npc":
        return (
          <QuotesGame
            gameState={gameData.npc}
            updateGameState={(newState) => updateGameState("npc", newState)}
            isMobilePortrait={isMobilePortrait}
            isMuted={isMuted}
          />
        );
      case "minerals":
        return (
          <GeologyGame
            gameState={gameData.minerals}
            updateGameState={(newState) =>
              updateGameState("minerals", newState)
            }
            isMobilePortrait={isMobilePortrait}
            isMuted={isMuted}
          />
        );
      default:
        return (
          <div className="flex h-full w-full items-center justify-center text-4xl text-main">
            Coming Soon!
          </div>
        );
    }
  };

  if (!isReady || progressLoading) {
    return <CropLoader error={loadError} onRetry={() => reloadGameData()} />;
  }

  return (
    <div
      className={`relative shadow-xl bg-no-repeat bg-center ${isMobilePortrait ? "" : "mt-2"}`}
      style={{
        backgroundImage: `url('${mainBackground}')`,
        backgroundSize: "100% 100%",
        width: isMobilePortrait ? "940px" : "1440px",
        height: isMobilePortrait ? "1500px" : "810px",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform:
            theme === "dark"
              ? `translateY(${DARK_CHILD_CONTENT_OFFSET_PX}px)`
              : undefined,
        }}
      >
        <h2
          className={`w-full justify-center items-center ${theme === "dark" ? "text-alternative-dark" : "text-main"} text-center text-7xl md:text-7xl font-semibold pt-2`}
        >
          {isGameSelected
            ? selectedGameData.label + " Bundle"
            : "Minigame Bundles"}
        </h2>

        {allBundlesFinished && !isGameSelected && (
          <div className="absolute top-1/2 md:top-[54%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center w-1/2 md:w-1/3 gap-2">
            <span
              className={`text-4xl ${allBundlesSuccessful ? "text-correct" : "text-wrong"} text-nowrap flex justify-center items-center bg-contain bg-no-repeat bg-center w-full h-[80px]`}
              style={{ backgroundImage: `url('${nameBannerBackground}')` }}
            >
              {allBundlesSuccessful ? "Community Center Restored!" : "Bundles not completed!"}
            </span>
            {allBundlesSuccessful ? (
              <GiftIcon
                isMuted={isMuted}
                onClick={() => {
                  setShowShareModal(true);
                }}
              />
            ) : (
              <CustomButton
                variant="icon"
                icon="/images/minigames/failButton.webp"
                layered={false}
                label="Share"
                isMuted={isMuted}
                onClick={() => {
                  setShowShareModal(true);
                }}
                soundPath="/sounds/modal.mp3"
              />
            )}
          </div>
        )}

        {isGameSelected ? (
          <div
            className={`relative bg-no-repeat bg-center ${isMobilePortrait ? "mt-[26px] ml-[120px]" : "mt-[20px] ml-[104px]"}`}
            style={{
              backgroundImage: `url('${innerBackground}')`,
              backgroundSize: "100% 100%",
              width: isMobilePortrait ? "700px" : "1232px",
              height: isMobilePortrait ? "1266px" : theme === "light" ? "579px" : "591px",
            }}
          >
            <div className={`absolute flex top-2 left-2 z-10`}>
              <CustomButton
                variant="share"
                icon="/images/minigames/arrowBack.webp"
                label="Return"
                isMuted={isMuted}
                onClick={() => {
                  setSelectedGame("");
                }}
                isMobilePortrait={isMobilePortrait}
              />
            </div>

            {renderMinigame()}
          </div>
        ) : (
          <div className="flex flex-col gap-2 h-full w-full items-center justify-center">
            {staticGameData.map((bundle) => (
              <BundleButton
                key={bundle.name}
                variant={bundle.bundleNum}
                label={bundle.label}
                onClick={() => {
                  staticGameData.forEach((b) => {
                    if (gameData[b.name].win && !gameData[b.name].animationSeen)
                      markAnimationSeen(b.name);
                  });
                  setSelectedGame(bundle.name);
                }}
                isMuted={isMuted}
                positionClass={bundle.pos}
                isAnimated={gameData[bundle.name].complete && gameData[bundle.name].win}
                isFailed={gameData[bundle.name].complete && !gameData[bundle.name].win}
                skipAnimation={gameData[bundle.name].animationSeen}
                onAnimationComplete={() => markAnimationSeen(bundle.name)}
              />
            ))}
          </div>
        )}

      </div>

      <div className={`absolute -top-[58px] md:-top-[55px] ${isMobilePortrait ? theme === "light" ? "-top-28" : "-top-28 left-4" : theme === "light" ? "" : "left-16"}`}>
        <AccountMenu isMuted={isMuted} />
      </div>
      <div className={`absolute flex gap-[5px] -top-[55px] right-0 ${isMobilePortrait ? theme === "light" ? "-top-28" : "-top-28 right-4" : theme === "light" ? "" : "right-16"}`}>
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
          onClick={toggleTheme}
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
        <UpdatesModal isMuted={isMuted} onClose={() => setShowUpdates(false)} />
      )}
      {showHelp && (
        <HelpModal
          isMuted={isMuted}
          onClose={() => setShowHelp(false)}
          selectedGame={selectedGame}
        />
      )}
      {showMinigameErrorModal && minigameSyncState.error && (
        <CustomModal
          title="Minigame sync failed"
          isMuted={isMuted}
          onClose={() => setShowMinigameErrorModal(false)}
          scaleFactor={scaleFactor}
          maxHeightClass="max-h-[80vh]"
        >
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-4 text-main">
            <p className="text-center text-xl">
              Your completed minigames are still saved on this device. Copy this error if you
              need help troubleshooting the account sync.
            </p>
            <pre className="max-h-[35vh] overflow-auto whitespace-pre-wrap break-words border-2 border-main bg-white/80 p-3 text-left text-base">
              {minigameSyncState.error}
            </pre>
            {errorCopyStatus && (
              <p role="status" className="text-center text-base">{errorCopyStatus}</p>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                className="clickable border-2 border-main bg-white/80 px-4 py-2 text-xl"
                onClick={copyMinigameSyncError}
              >
                Copy error
              </button>
              <button
                type="button"
                className="clickable border-2 border-main bg-white/80 px-4 py-2 text-xl"
                onClick={retryMinigameSync}
              >
                Retry sync
              </button>
            </div>
          </div>
        </CustomModal>
      )}
      {showShareModal && (
        <MinigamesShareModal
          shareText={shareText}
          totalSuccesses={globalBundleStats.successes}
          totalAttempts={globalBundleStats.attempts}
          onClose={() => setShowShareModal(false)}
          isMuted={isMuted}
        />
      )}
    </div>
  );
}
