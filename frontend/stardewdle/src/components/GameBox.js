import { useState, useEffect } from "react";
import { useSound } from "../context/SoundContext";
import { formatName } from "../utils/formatString";

import CropGrid from "./CropGrid";
import GuessGrid from "./GuessGrid";
import CropLoader from "../components/CropLoader";
import ShareModal from "./ShareModal";
import HelpModal from "./HelpModal";
import UpdatesModal from "./UpdatesModal";
import HintsModal from "./HintsModal";

import CustomButton from "../components/CustomButton";

const DAILY_RESET_ENABLED = true;
const MOST_RECENT_UPDATE = "2026-03-12T22:10:00Z";

function todaysDate() {
  const today = new Date(new Date().toUTCString());
  return `${today.getUTCMonth() + 1
    }/${today.getUTCDate()}/${today.getUTCFullYear()}`;
}

function getTimeUntilMidnightUTC() {
  const now = new Date();
  const utcNow = new Date(now.toUTCString());
  const utcMidnight = new Date(
    Date.UTC(
      utcNow.getUTCFullYear(),
      utcNow.getUTCMonth(),
      utcNow.getUTCDate() + 1,
      0,
      0,
      0
    )
  );
  const diff = utcMidnight - utcNow;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

export default function GameBox({ isMobilePortrait }) {
  const [correctCrop, setCorrectCrop] = useState(() => {
    const saved = localStorage.getItem("stardewdle-correctCrop");
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedCrop, setSelectedCrop] = useState(() => {
    const saved = localStorage.getItem("stardewdle-selectedCrop");
    return saved ? JSON.parse(saved) : null;
  });
  const [guesses, setGuesses] = useState(() => {
    const saved = localStorage.getItem("stardewdle-guesses");
    return saved ? JSON.parse(saved) : [];
  });
  const [gameOver, setGameOver] = useState(() => {
    const saved = localStorage.getItem("stardewdle-gameOver");
    return saved ? JSON.parse(saved) : false;
  });
  const [storedDate, setStoredDate] = useState(() => {
    const saved = localStorage.getItem("stardewdle-date");
    return saved ? saved : new Date().toISOString().split("T")[0];
  });
  const [crops, setCrops] = useState(() => {
    const saved = localStorage.getItem("stardewdle-crops");

    if (saved) {
      try {
        const parsedCrops = JSON.parse(saved);

        if (parsedCrops.length === 0) return [];

        const hasCropIndex = Object.hasOwn(parsedCrops[0], 'crop_index');

        if (!hasCropIndex || parsedCrops[22]["type"] !== "fruit") {
          console.log("Outdated crop data, resetting crops");
          localStorage.removeItem("stardewdle-crops");
          return [];
        }

        return parsedCrops;
      } catch (e) {
        console.error("Error parsing saved crops:", e);
        return [];
      }
    }

    return [];
  });
  const [showHints, setShowHints] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareText, setShareText] = useState("");
  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnightUTC());
  const [correctGuesses, setCorrectGuesses] = useState(null);
  const [totalGuesses, setTotalGuesses] = useState(null);
  const [showUpdates, setShowUpdates] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);

  const [selectionOffset, setSelectionOffset] = useState(0);
  useEffect(() => {
    setSelectionOffset(parseInt(selectedCrop?.crop_index) / 71 * 100);
  }, [selectedCrop]);

  const { isMuted, toggleMute } = useSound();

  const [hints, setHints] = useState(() => {
    const saved = localStorage.getItem("stardewdle-hints");
    return saved
      ? JSON.parse(saved)
      : {
        growth_time: false,
        base_price: false,
        regrows: false,
        type: false,
        season: false,
      };
  });
  const [constraints, setConstraints] = useState(() => {
    const saved = localStorage.getItem("stardewdle-constraints");
    if (JSON.parse(saved)) {
      if (JSON.parse(saved).growth_time.length !== 2) {
        return {
          name: [],
          growth_time: [0, 99],
          base_price: [0, 9999],
          regrows: [],
          type: [],
          season: [],
        };
      }
    }
    return saved
      ? JSON.parse(saved)
      : {
        name: [],
        growth_time: [0, 99],
        base_price: [0, 9999],
        regrows: [],
        type: [],
        season: [],
      };
  });

  const addConstraints = (crop) => {
    setConstraints((prevConstraints) => {
      const newConstraints = { ...prevConstraints };

      for (const key in newConstraints) {
        if (Object.hasOwn(crop, key)) {
          const prevArray = prevConstraints[key];
          if (key === "growth_time" || key === "base_price") {
            newConstraints[key] =
              crop[key] === correctCrop[key] ? [correctCrop[key] - 1, correctCrop[key] + 1] :
                [correctCrop[key] > crop[key] && crop[key] > prevArray[0] ? crop[key] : prevArray[0],
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

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (
      storedDate !== today ||
      (correctCrop != null &&
        correctCrop.date !== undefined &&
        correctCrop.date !== today)
    ) {
      console.log("Resetting game due to date change");
      resetStored();
      return;
    }
  }, [correctCrop, storedDate]);

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
    const lastSeen = localStorage.getItem("stardewdle-lastUpdateSeen");

    if (!lastSeen) {
      setShouldPulse(true);
    } else {
      const lastSeenDate = new Date(lastSeen);
      const mostRecentDate = new Date(MOST_RECENT_UPDATE);

      if (lastSeenDate < mostRecentDate) {
        setShouldPulse(true);
      }
    }
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
    if (gameOver) {
      setSelectedCrop(correctCrop);
    }
  }, [gameOver, correctCrop]);

  useEffect(() => {
    if (!DAILY_RESET_ENABLED) return;

    localStorage.setItem("stardewdle-guesses", JSON.stringify(guesses));
    localStorage.setItem("stardewdle-correctCrop", JSON.stringify(correctCrop));
    localStorage.setItem("stardewdle-gameOver", JSON.stringify(gameOver));
    localStorage.setItem("stardewdle-selectedCrop", JSON.stringify(selectedCrop));
    localStorage.setItem("stardewdle-date", storedDate);
    localStorage.setItem("stardewdle-crops", JSON.stringify(crops));
    localStorage.setItem("stardewdle-hints", JSON.stringify(hints));
    localStorage.setItem("stardewdle-constraints", JSON.stringify(constraints));
  }, [
    guesses,
    correctCrop,
    gameOver,
    selectedCrop,
    storedDate,
    crops,
    hints,
    constraints,
  ]);

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
    if (!showShareModal) return;

    const updateGuessStats = async () => {
      try {
        const res = await fetch(process.env.REACT_APP_API_URL + "/word");
        const data = await res.json();
        setCorrectGuesses(data.correct_guesses);
        setTotalGuesses(data.total_guesses);
      } catch (err) {
        console.error("Failed to fetch win stats:", err);
      }
    };

    function getColor(key, guessValue, correctValue) {
      if (key === "season") {
        const g = guessValue[0] === "all" ? ["winter", "spring", "summer", "fall"] : guessValue;
        const c = correctValue[0] === "all" ? ["winter", "spring", "summer", "fall"] : correctValue;
        return (g.length === c.length && g.every((s) => c.includes(s))) ? "🟩" : g.some((s) => c.includes(s)) ? "🟨" : "🟥";
      }

      return guessValue === correctValue ? "🟩" : "🟥";
    }

    function generateShareText(resultGrid, win) {
      const header = win
        ? "I solved today's Stardewdle!"
        : "I couldn't solve today's Stardewdle.";
      const grid = resultGrid
        .map((row) =>
          ["growth_time", "base_price", "regrows", "type", "season"]
            .map((key) => getColor(key, row.crop[key], correctCrop[key]))
            .join("")
        )
        .join("\n");

      return `${todaysDate()}\n${header}\n${grid}\nPlay at: https://stardewdle.com/`;
    }

    setShareText(generateShareText(guesses, guesses[guesses.length - 1].crop.name === correctCrop.name));
    updateGuessStats();

  }, [showShareModal, guesses, correctCrop,]);

  useEffect(() => {
    if (!DAILY_RESET_ENABLED) return;

    const fetchNewCrop = async () => {
      try {
        if (crops.length === 0) {
          const cropResponse = await fetch(
            `${process.env.REACT_APP_BUCKET_URL}/data/crops.json`
          );
          if (!cropResponse.ok) {
            throw new Error(`HTTP error! status: ${cropResponse.status}`);
          }
          const cropList = await cropResponse.json();
          setCrops(cropList);
        }

        if (crops.length === 0) return;

        const response = await fetch(process.env.REACT_APP_API_URL + "/word");
        const data = await response.json();
        const word = data.word;
        const cropDate = data.correct_date;

        const cropData = crops.find(
          (crop) => crop.name.toLowerCase() === word.toLowerCase()
        );

        if (cropData) {
          const cropDataWithDate = { ...cropData, date: cropDate };
          setCorrectCrop(cropDataWithDate);
        } else {
          console.warn("Crop not found for word:", word);
        }
      } catch (error) {
        console.error("Failed to fetch crop data or word:", error);
      }
    };

    const today = new Date().toISOString().split("T")[0];

    if (
      !correctCrop ||
      crops.length === 0 ||
      storedDate !== today ||
      (correctCrop != null &&
        correctCrop.date !== undefined &&
        correctCrop.date !== today)
    ) {
      if (
        storedDate !== today ||
        (correctCrop != null &&
          correctCrop.date !== undefined &&
          correctCrop.date !== today)
      ) {
        resetStored();
      }
      fetchNewCrop();
    }
  }, [storedDate, correctCrop, crops]);

  const handleSubmit = async () => {
    if (!selectedCrop || guesses.length >= 6 || gameOver) return;

    const today = new Date().toISOString().split("T")[0];
    if (
      storedDate !== today ||
      (correctCrop != null &&
        correctCrop.date === undefined) ||
      (correctCrop != null &&
        correctCrop.date !== undefined &&
        correctCrop.date !== today)
    ) {
      console.log("Resetting game due to date change"); // make message visible to user
      resetStored(true);
      return;
    }

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
      const response = await fetch(process.env.REACT_APP_API_URL + "/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guess: selectedCrop.name,
          guessNum: updatedGuesses.length,
        }),
      });

      const data = await response.json();
      const result = data.result;

      const isWin = result && Object.values(result).every((val) => val === "match");

      if (isWin) {
        if (!isMuted) new Audio("/sounds/reward.mp3").play();
      } else {
        if (!isMuted) new Audio("/sounds/lose.mp3").play();
      }

      setGameOver(true);
      setShowShareModal(true);

    } catch (error) {
      console.error("Error submitting guess:", error);
    }
  };

  if (!correctCrop || crops.length === 0) {
    return (
      <CropLoader
        className={isMobilePortrait ? "content-counter-rotate-mobile" : ""}
      />
    );
  }

  const spriteStyle = {
    backgroundImage: 'var(--sprite-url)',
    backgroundPosition: `${selectionOffset}% 0%`,
    backgroundSize: '7200% 100%',
    imageRendering: 'pixelated',
  };

  return (
    <div
      className={`relative shadow-xl bg-no-repeat bg-center ${isMobilePortrait
        ? "gamebox-mobile-layout"
        : "flex flex-row justify-between w-full pl-3 mt-3"
        }`}
      style={{
        backgroundImage: isMobilePortrait
          ? "url('/images/box-bg-sm.webp')"
          : "url('/images/box-bg.webp')",
        backgroundSize: "100% 100%",
        width: isMobilePortrait ? "1500px" : "1600px",
        height: isMobilePortrait ? "940px" : "800px",
      }}
    >
      <div
        className={
          isMobilePortrait
            ? "flex justify-center items-center h-[76%] w-[47%] translate-y-[16%] translate-x-[6.5%]"
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

      <div
        className={`flex flex-col align-center w-full place-items-center ${isMobilePortrait ? "content-counter-rotate-mobile" : ""
          }`}
      >
        <div
          className={`flex flex-row items-center h-full ${isMobilePortrait ? "mr-6 mt-[96px]" : "mr-24 mt-[80px]"
            }  gap-4`}
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
              <p className="text-5xl text-center text-[#BC6131] tracking-wide">
                {selectedCrop ? formatName(selectedCrop.name) : ""}
              </p>
            </div>
            {/*JSON.stringify(constraints)*/}
            {gameOver &&
              (guesses[5] ? guesses[5].crop.name === correctCrop.name : true) ? (
              <div className="mt-4 flex items-center justify-center gap-4">
                <p className="text-green-700 text-5xl font-bold whitespace-nowrap">
                  You guessed it!
                </p>
                  <CustomButton
                    variant="share"
                    icon={"images/share-button.webp"}
                    label={"Share"}
                    soundPath={"/sounds/modal.mp3"}
                    onClick={() => {
                      setShowShareModal(true);
                    }}
                    isMobilePortrait={isMobilePortrait}
                  />
              </div>
            ) : guesses.length >= 6 ? (
              <>
                <div className="mt-4 flex items-center justify-center gap-4">
                  <p className="text-red-600 text-5xl font-bold whitespace-nowrap">
                    Better luck next time!
                  </p>
                  <div
                    onClick={() => {
                      if (!isMuted) {
                        new Audio("/sounds/modal.mp3").play();
                      }
                      setShowShareModal(true);
                    }}
                    className="w-[40px] h-[40px] cursor-pointer z-10"
                  >
                    <div className="clickable w-full h-full relative group">
                      <img
                        src="/images/share-button.webp"
                        alt="Share"
                        className="w-full h-full transition-opacity duration-200 group-hover:opacity-0"
                      />
                      <img
                        src="/images/share-button-hover.webp"
                        alt="Share Hover"
                        className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <CustomButton
                variant="submit"
                icon={"images/submit-button.webp"}
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
            backgroundImage: "url('/images/guesses.webp')",
            width: isMobilePortrait ? "750px" : "772px",
            height: "456px",
          }}
        >
          <GuessGrid guesses={guesses} answer={correctCrop} />
        </div>
      </div>
      <div
        className={`absolute flex gap-[5px] ${isMobilePortrait
          ? " bottom-[100px] -right-[145px] content-counter-rotate-mobile"
          : "-top-[55px] right-0"
          } `}
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
          icon={Object.values(hints).some((value) => value) ? "/images/hint-on.webp" : "/images/hint-off.webp"}
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
          onClick={() => {
            setShowUpdates(true);

            localStorage.setItem(
              "stardewdle-lastUpdateSeen",
              new Date().toISOString()
            );
            setShouldPulse(false);
          }}
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
          correctGuesses={correctGuesses}
          totalGuesses={totalGuesses}
          timeLeft={timeLeft}
          onClose={() => setShowShareModal(false)}
          isMuted={isMuted}
        />
      )}
    </div>
  );
}
