import { useState, useEffect } from "react";
import { useSound } from "../../context/SoundContext";
import { useGameData } from "../../context/GameDataContext";
import { getTimeUntilMidnightUTC } from "../../utils/dateUtils";
import { playSound } from "../../utils/playSound";

import CookingGame from "./CookingGame";
import FishingGame from "./FishingGame";
import QuotesGame from "./QuotesGame";
import GeologyGame from "./GeologyGame";

import CropLoader from "../CropLoader";
import CustomButton from "../CustomButton";
import HelpModal from "./MinigamesHelp";
import UpdatesModal from "../UpdatesModal";
import BundleButton from "./BundleButton";
import GiftIcon from "./GiftIcon";

const staticGameData =
  [
    {
      name: "food",
      label: "Home Cook's",
      bundleNum: 6,
      pos: "top-[30%] left-[35%]",
      // 5 bundle: pos: "top-[25%] left-[50%]",
    },
    /*{
        name: "map",
        label: "Treasure Hunter's",
        bundleNum: 2,
        imgPath: "treasureHunter",
        // 5 bundle: pos: "top-[50%] left-[25%]",
    },*/
    {
      name: "npc",
      label: "Helper's",
      bundleNum: 3,
      imgPath: "helper",
      pos: "top-[30%] left-[65%]",
      // 5 bundle: pos: "top-[50%] left-[75%]",
    },
    {
      name: "minerals",
      label: "Geologist's",
      bundleNum: 5,
      imgPath: "geologist",
      pos: "top-[70%] left-[25%]",
      // 5 bundle: pos: "top-[75%] left-1/3",
    },
    {
      name: "fish",
      label: "Quality Fish",
      bundleNum: 7,
      imgPath: "qualityFish",
      pos: "top-[70%] left-[75%]",
      // 5 bundle: pos: "top-[75%] left-2/3",
    }
  ];

export default function MinigamesBox({ isMobilePortrait }) {
  const {
    isReady,
    dailyData,
    showUpdates,
    setShowUpdates,
    shouldPulse,
    handleOpenUpdates
  } = useGameData();

  const { isMuted, toggleMute } = useSound();

  const [showHelp, setShowHelp] = useState(false);
  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnightUTC());

  const [selectedGame, setSelectedGame] = useState("");
  const [selectedGameData, setSelectedGameData] = useState(null);
  const [isGameSelected, setIsGameSelected] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const isNewDay = localStorage.getItem("stardewdle-date") !== todayStr;

  const [gameData, setGameData] = useState(() => {
    const defaultGameData = {
      food: { complete: false, win: false, guesses: [], animationSeen: false, helpSeen: false },
      //map: { complete: true, win: false, guesses: [], animationSeen: false, helpSeen: false },
      npc: { complete: false, win: false, guesses: [], animationSeen: false, helpSeen: false },
      minerals: { complete: false, win: false, guesses: [], animationSeen: false, helpSeen: false },
      fish: { complete: false, win: false, guesses: [], animationSeen: false, helpSeen: false }
    };

    if (isNewDay) return defaultGameData;

    const saved = localStorage.getItem("stardewdle-game-data");
    return saved ? JSON.parse(saved) : defaultGameData;
  });

  const allBundlesComplete = ['food'/*, 'map'*/, 'npc', 'minerals', 'fish'].every(key => gameData[key]?.complete);

  const [globalCompletions, setGlobalCompletions] = useState(0);

  useEffect(() => {
    setGlobalCompletions(dailyData?.bundleCompletions ?? 0);
  }, [dailyData?.bundleCompletions]);

  useEffect(() => {
    setSelectedGameData(staticGameData.find(item => item.name === selectedGame) || null);
    setIsGameSelected(selectedGame !== "");
  }, [selectedGame]);

  useEffect(() => {
    if (allBundlesComplete && !gameData.apiSynced) {

      const recordCompletion = async () => {
        try {
          const response = await fetch(import.meta.env.VITE_API_URL + "/bundle-complete", {
            method: "POST"
          });

          if (response.ok) {
            const data = await response.json();
            setGlobalCompletions(data.newTotal);

            setGameData(prev => {
              const updated = { ...prev, apiSynced: true };
              localStorage.setItem("stardewdle-game-data", JSON.stringify(updated));
              return updated;
            });
          }
        } catch (error) {
          console.error("Failed to sync bundle completion:", error);
        }
      };

      recordCompletion();
    }
  }, [allBundlesComplete, gameData.apiSynced]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Tab is visible again, reloading...");
        window.location.reload();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const hasSeenHelp = localStorage.getItem(`stardewdle-hasSeenMinigame${selectedGame}Help`);
    if (!hasSeenHelp) {
      setShowHelp(true);
      localStorage.setItem(`stardewdle-hasSeenMinigame${selectedGame}Help`, "true");
    }
  }, [selectedGame]);

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeUntilMidnightUTC()), 1000);
    return () => clearInterval(interval);
  }, []);

  const updateGameState = (gameName, newState) => {
    setGameData(prev => {
      const updated = { ...prev, [gameName]: newState };
      localStorage.setItem("stardewdle-game-data", JSON.stringify(updated));
      return updated;
    });
  };

  const markAnimationSeen = (gameName) => {
    setGameData(prev => {
      const updated = {
        ...prev,
        [gameName]: { ...prev[gameName], animationSeen: true }
      };
      localStorage.setItem("stardewdle-game-data", JSON.stringify(updated));
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
            updateGameState={(newState) => updateGameState("minerals", newState)}
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

  if (!isReady) {
    return <CropLoader />;
  }

  return (
    <div
      className={`relative shadow-xl bg-no-repeat bg-center ${isMobilePortrait ? "" : "mt-2"}`}
      style={{
        backgroundImage:
          isMobilePortrait ? "url('/images/minigames/mainBG-mobile.webp')"
            : selectedGame === "map"
              ? "url('/images/minigames/mainBG2.webp')"
              : "url('/images/minigames/mainBG.webp')",
        backgroundSize: "100% 100%",
        width: isMobilePortrait ? "940px" : "1440px",
        height: isMobilePortrait ? "1500px" : "810px",
      }}
    >
      <h2 className="w-full justify-center items-center text-main text-center text-7xl md:text-7xl font-semibold pt-2">
        {isGameSelected
          ? selectedGameData.label + " Bundle"
          : "Minigame Bundles"}
      </h2>

      {allBundlesComplete && !isGameSelected && (
        <div className="absolute top-1/2 md:top-[54%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3 bg-[url('/images/minigames/innerBG.webp')] border-4 border-main p-4 bg-opacity-0 w-1/2 md:w-1/3">
          <span className="text-3xl text-correct">
            Community Center Restored!
          </span>
          <GiftIcon />

          <span className="text-3xl text-main ">
            Total Restorations Today: {globalCompletions}
          </span>

          <span className="text-3xl text-main ">
            Time until new bundles: {timeLeft.hours}h{" "} {timeLeft.minutes}m {timeLeft.seconds}s
          </span>
        </div>
      )}

      {isGameSelected ? (
        <div
          className={`relative bg-no-repeat bg-center ${isMobilePortrait ? "mt-[26px] ml-[120px]" : "mt-[20px] ml-[104px]"}`}
          style={{
            backgroundImage: isMobilePortrait ? "url('/images/minigames/innerBG-mobile.webp')" : "url('/images/minigames/innerBG.webp')",
            backgroundSize: "100% 100%",
            width: isMobilePortrait ? "700px" : "1232px",
            height: isMobilePortrait ? "1266px" : "579px",
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
                staticGameData.map(b => {
                  if (gameData[b.name].complete && !gameData[b.name].animationSeen) markAnimationSeen(b.name);
                });
                setSelectedGame(bundle.name);
              }}
              isMuted={isMuted}
              positionClass={bundle.pos}
              isAnimated={gameData[bundle.name].complete}
              skipAnimation={gameData[bundle.name].animationSeen}
              onAnimationComplete={() => markAnimationSeen(bundle.name)}
            />
          ))}
        </div>
      )}

      <div className={`absolute flex gap-[5px] -top-[55px] right-0`}>
        <CustomButton
          variant="icon"
          icon={isMuted ? "/images/muted.webp" : "/images/unmuted.webp"}
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
          icon={"/images/question-mark.webp"}
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
          icon="/images/info.webp"
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
        <HelpModal isMuted={isMuted} onClose={() => setShowHelp(false)} selectedGame={selectedGame}/>
      )}
    </div>
  );
}
