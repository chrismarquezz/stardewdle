import { useState, useEffect } from "react";
import { useSound } from "../../context/SoundContext";
import { formatName } from "../../utils/formatString";
import { useGameData } from "../../context/GameDataContext";
import { todaysDate, getTimeUntilMidnightUTC } from "../../utils/dateUtils";

import CropGrid from "./CropGrid";
import GuessGrid from "./GuessGrid";
import CropLoader from "../CropLoader";
import ShareModal from "./ShareModal";
import HelpModal from "./HelpModal";
import UpdatesModal from "../UpdatesModal";
import HintsModal from "./HintsModal";
import CustomButton from "../CustomButton";

export default function GameBox({ isMobilePortrait }) {
  const {
    crops,
    dailyData,
    isReady,
    showUpdates,
    setShowUpdates,
    shouldPulse,
    handleOpenUpdates
  } = useGameData();

  const { isMuted, toggleMute } = useSound();

  const correctCrop = dailyData?.correctCrop;

  const todayStr = new Date().toISOString().split("T")[0];
  const isNewDay = localStorage.getItem("stardewdle-date") !== todayStr;

  const [selectedCrop, setSelectedCrop] = useState(() => {
    if (isNewDay) return null;
    const saved = localStorage.getItem("stardewdle-selectedCrop");
    return saved ? JSON.parse(saved) : null;
  });

  const [guesses, setGuesses] = useState(() => {
    if (isNewDay) return [];
    const saved = localStorage.getItem("stardewdle-guesses");
    return saved ? JSON.parse(saved) : [];
  });

  const [gameOver, setGameOver] = useState(() => {
    if (isNewDay) return false;
    const saved = localStorage.getItem("stardewdle-gameOver");
    return saved ? JSON.parse(saved) : false;
  });

  const [storedStats, setStoredStats] = useState(() => {
    const saved = localStorage.getItem("stardewdle-stats");

    let stats = {
      streak: 0,
      total: 0,
      lastPlayedDate: null,
      accuracy: {
        0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0,
      }
    };

    if (saved) {
      stats = { ...stats, ...JSON.parse(saved) };
    }

    if (stats.lastPlayedDate) {
      const lastDate = new Date(stats.lastPlayedDate + "T00:00:00Z");
      const todayDate = new Date(todayStr + "T00:00:00Z");

      const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        stats.streak = 0;
      }
    }

    return stats;
  });

  const [showHints, setShowHints] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareText, setShareText] = useState("");
  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnightUTC());
  const [correctGuesses, setCorrectGuesses] = useState(null);
  const [totalGuesses, setTotalGuesses] = useState(null);

  const [selectionOffset, setSelectionOffset] = useState(0);
  useEffect(() => {
    setSelectionOffset(parseInt(selectedCrop?.crop_index) / 71 * 100);
  }, [selectedCrop]);

  const [hints, setHints] = useState(() => {
    if (isNewDay) return { growth_time: false, base_price: false, regrows: false, type: false, season: false };
    const saved = localStorage.getItem("stardewdle-hints");
    return saved ? JSON.parse(saved) : { growth_time: false, base_price: false, regrows: false, type: false, season: false };
  });

  const [constraints, setConstraints] = useState(() => {
    const defaultConstraints = { name: [], growth_time: [0, 99], base_price: [0, 9999], regrows: [], type: [], season: [] };
    if (isNewDay) return defaultConstraints;

    const saved = localStorage.getItem("stardewdle-constraints");
    if (JSON.parse(saved)?.growth_time?.length !== 2) {
      return defaultConstraints;
    }
    return saved ? JSON.parse(saved) : defaultConstraints;
  });

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
    const hasSeenHelpModal = localStorage.getItem(
      "stardewdle-hasSeenHelpModal"
    );
    if (!hasSeenHelpModal) {
      setShowHelp(true);
      localStorage.setItem("stardewdle-hasSeenHelpModal", "true");
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilMidnightUTC());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (gameOver && correctCrop) {
      setSelectedCrop(correctCrop);
    }
  }, [gameOver, correctCrop]);

  useEffect(() => {
    localStorage.setItem("stardewdle-guesses", JSON.stringify(guesses));
    localStorage.setItem("stardewdle-gameOver", JSON.stringify(gameOver));
    localStorage.setItem("stardewdle-selectedCrop", JSON.stringify(selectedCrop));
    localStorage.setItem("stardewdle-hints", JSON.stringify(hints));
    localStorage.setItem("stardewdle-constraints", JSON.stringify(constraints));
    localStorage.setItem("stardewdle-stats", JSON.stringify(storedStats));
  }, [guesses, gameOver, selectedCrop, hints, constraints, storedStats]);

  function resetStored(refresh = false) {
    setGuesses([]);
    setSelectedCrop(null);
    setGameOver(false);
    setStoredDate(new Date().toISOString().split("T")[0]);
    setConstraints({
      name: [],
      growth_time: [0, 99],
      base_price: [0, 9999],
      regrows: [],
      type: [],
      season: [],
    });
    if (refresh) {
      window.location.reload();
      console.log("Reloaded due to date change");
    }
  }

  useEffect(() => {
    if (!showShareModal || !correctCrop) return;

    function getColor(key, guessValue, correctValue) {
      if (key === "season") {
        const g = guessValue[0] === "all" ? ["winter", "spring", "summer", "fall"] : guessValue;
        const c = correctValue[0] === "all" ? ["winter", "spring", "summer", "fall"] : correctValue;
        return (g.length === c.length && g.every((s) => c.includes(s))) ? "🟩" : g.some((s) => c.includes(s)) ? "🟨" : "🟥";
      }
      return guessValue === correctValue ? "🟩" : "🟥";
    }

    const win = guesses[guesses.length - 1]?.crop?.name === correctCrop.name;
    const header = win ? "I solved today's Stardewdle!" : "I couldn't solve today's Stardewdle.";
    const streak = storedStats.streak > 1 ? `I'm on a ${storedStats.streak} streak!\n` : ""
    const grid = guesses.map((row) =>
      ["growth_time", "base_price", "regrows", "type", "season"]
        .map((key) => getColor(key, row.crop[key], correctCrop[key]))
        .join("")
    ).join("\n");

    setShareText(`${todaysDate()}\n${header}\n${streak}${grid}\nPlay at: https://stardewdle.com/`);
  }, [showShareModal, guesses, correctCrop, storedStats.streak]);

  const addConstraints = (crop) => {
    if (!correctCrop) return;
    setConstraints((prevConstraints) => {
      const newConstraints = { ...prevConstraints };
      for (const key in newConstraints) {
        if (Object.hasOwn(crop, key)) {
          const prevArray = prevConstraints[key];
          if (key === "growth_time" || key === "base_price") {
            newConstraints[key] = crop[key] === correctCrop[key]
              ? [correctCrop[key] - 1, correctCrop[key] + 1]
              : [correctCrop[key] > crop[key] && crop[key] > prevArray[0] ? crop[key] : prevArray[0],
              correctCrop[key] < crop[key] && crop[key] < prevArray[1] ? crop[key] : prevArray[1]]
            continue;
          }
          const newValue =
            key === "season" && (correctCrop["season"][0] === "all" || (correctCrop["season"].length > 1 && correctCrop["season"].includes(crop["season"][0])))
              ? null
              : key === "season" && crop["season"][0] === "all"
                ? ["spring", "summer", "fall", "winter"]
                : JSON.stringify(crop[key]) === JSON.stringify(correctCrop[key])
                  ? key === "regrows"
                    ? !correctCrop["regrows"]
                    : key === "type"
                      ? ["fruit", "vegetable", "flower", "forage"].filter(
                        (type) => type !== crop["type"]
                      )
                      : key === "season" && crop["season"].length === 1
                        ? [["spring"], ["summer"], ["fall"], ["winter"]].filter(
                          (season) => season[0] !== crop["season"][0]
                        )
                        : null
                  : crop[key];
          if (newValue === null) continue;
          if (Array.isArray(newValue) && newValue.length === 3) {
            newValue.forEach((val) => {
              if (!prevArray.includes(val)) {
                newConstraints[key] = [...newConstraints[key], val];
              }
            });
          } else {
            if (!prevArray.includes(newValue)) {
              newConstraints[key] = [...prevArray, newValue];
            }
          }
        }
      }

      return newConstraints;
    });
  };

  const handleSubmit = async () => {
    if (!selectedCrop || guesses.length >= 6 || gameOver || !correctCrop) return;

    const updatedGuesses = [...guesses, { crop: selectedCrop }];
    setGuesses(updatedGuesses);
    addConstraints(selectedCrop);

    if (!gameOver && updatedGuesses.length < 6) setSelectedCrop(null);

    const isFullMatch = ["growth_time", "base_price", "regrows", "type", "season"].every((key) => {
      const guessVal = selectedCrop?.[key];
      const answerVal = correctCrop?.[key];
      if (key === "season") {
        const g = Array.isArray(guessVal) ? guessVal : [];
        const a = Array.isArray(answerVal) ? answerVal : [];
        return g.length === a.length && g.every((s) => a.includes(s));
      }
      return guessVal === answerVal;
    });

    if (!isFullMatch && updatedGuesses.length < 6) {
      if (!isMuted) new Audio("/sounds/sell.mp3").play();
      return;
    }

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + "/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess: selectedCrop.name, guessNum: updatedGuesses.length }),
      });

      const isWin = isFullMatch;
      const guessCount = isWin ? updatedGuesses.length : 0;
      const todayStr = new Date().toISOString().split("T")[0];

      setStoredStats((prev) => {
        return {
          ...prev,
          lastPlayedDate: todayStr,
          streak: isWin ? prev.streak + 1 : 0,
          total: prev.total + 1,
          accuracy: { ...prev.accuracy, [guessCount]: prev.accuracy[guessCount] + 1 },
        };
      });

      if (!isMuted) new Audio(isWin ? "/sounds/reward.mp3" : "/sounds/lose.mp3").play();

      setGameOver(true);
      setShowShareModal(true);

    } catch (error) {
      console.error("Error submitting guess:", error);
    }
  };

  if (!isReady || !correctCrop || crops.length === 0) {
    return <CropLoader />;
  }

  const spriteStyle = {
    backgroundImage: 'var(--sprite-url)',
    backgroundPosition: `${selectionOffset}% 0%`,
    backgroundSize: '7200% 100%',
    imageRendering: 'pixelated',
  };

  return (
    <div
      className={`relative shadow-xl bg-no-repeat bg-center flex ${isMobilePortrait
        ? "flex-col-reverse items-center w-full"
        : "flex-row justify-between w-full pl-3 mt-3"
        }`}
      style={{
        backgroundImage: isMobilePortrait
          ? "url('/images/game/box-bg-sm.jpg')"
          : "url('/images/game/box-bg.webp')",
        backgroundSize: "100% 100%",
        width: isMobilePortrait ? "940px" : "1600px",
        height: isMobilePortrait ? "1500px" : "800px",
      }}
    >
      <div
        className={
          isMobilePortrait
            ? "flex justify-center items-center w-[76%] h-[47%] py-6"
            : "flex justify-center items-center h-full w-[90%] mt-[2px]"
        }
      >
        <CropGrid
          selectedCrop={selectedCrop}
          onSelect={
            !gameOver && guesses.length < 6 ? setSelectedCrop : () => { }
          }
          crops={crops}
          isMuted={!gameOver && guesses.length < 6 ? isMuted : true}
          isMobilePortrait={isMobilePortrait}
          constraints={constraints}
          hints={hints}
        />
      </div>

      <div className="flex flex-col align-center w-full place-items-center">
        <div
          className={`flex flex-row items-center h-full ${isMobilePortrait ? "mt-20" : "mr-24 mt-[80px]"} gap-4`}
        >
          <div
            className="relative bg-no-repeat bg-contain"
            style={{
              backgroundImage: "url('/images/selected-frame.webp')",
              width: "240px",
              height: "164px",
            }}
          >
            {selectedCrop && (
              <div
                style={spriteStyle}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[98.4px] w-[98.4px] bg-no-repeat"
                title={selectedCrop.name}
              />
            )}
          </div>
          <div className="flex flex-col items-center">
            <div
              className="flex items-center justify-center bg-center bg-no-repeat bg-contain"
              style={{
                backgroundImage: "url('/images/name-banner.webp')",
                width: "416px",
                height: "76px",
              }}
            >
              <p className="text-5xl text-center text-main tracking-wide">
                {selectedCrop ? formatName(selectedCrop.name) : ""}
              </p>
            </div>
            {/*JSON.stringify(constraints)*/}
            {gameOver ? (
              <div className="mt-4 flex items-center justify-center gap-4">
                {(guesses[5] ? guesses[5].crop.name === correctCrop.name : true) ? (
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
                className={`mt-4 ${!selectedCrop || guesses.length >= 6 || gameOver
                  ? "opacity-40 pointer-events-none"
                  : ""
                  }`}
              />
            )}
          </div>
        </div>
        <div
          className={`${isMobilePortrait ? "ml-2 pl-6 pb-2" : "pl-9 mr-[78px]"
            } mb-[84px] bg-center bg-no-repeat bg-contain min-h-[440px]`}
          style={{
            backgroundImage: "url('/images/game/guesses.webp')",
            width: isMobilePortrait ? "750px" : "772px",
            height: "456px",
          }}
        >
          <GuessGrid guesses={guesses} answer={correctCrop} />
        </div>
      </div>
      <div
        className={`absolute flex gap-[5px] -top-[55px] right-0`}
      >
        <CustomButton
          variant="icon"
          icon={isMuted ? "/images/muted.webp" : "/images/unmuted.webp"}
          label={isMuted ? "Unmute" : "Mute"}
          isMuted={true}
          onClick={() => {
            if (isMuted) {
              new Audio("/sounds/pluck.mp3").play();
            }
            toggleMute();
          }}
          showLabel={true}
          isMobilePortrait={isMobilePortrait}
        />

        <CustomButton
          variant="icon"
          icon={Object.values(hints).some((value) => value) ? "/images/game/hint-on.webp" : "/images/game/hint-off.webp"}
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
          timeLeft={timeLeft}
          onClose={() => setShowShareModal(false)}
          isMuted={isMuted}
          storedStats={storedStats}
        />
      )}
    </div>
  );
}
