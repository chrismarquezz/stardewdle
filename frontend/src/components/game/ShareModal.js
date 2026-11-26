import ReactDOM from "react-dom";
import React, { useState } from "react";
import CustomButton from "../CustomButton";
import { useTheme } from "../../context/ThemeContext";
import { useThemedAsset } from "../../hooks/useThemedAsset";
import { playSound } from "../../utils/playSound";
import { scrollbarStyles } from "../../utils/scrollbarStyles";
import { useTimeUntilMidnightUTC } from "../../hooks/useTimeUntilMidnightUTC";

export default function ShareModal({
  shareText,
  correctGuesses,
  totalGuesses,
  onClose,
  isMuted,
  scaleFactor,
  storedStats,
}) {
  const [copied, setCopied] = useState(false);
  const timeLeft = useTimeUntilMidnightUTC();
  const { theme } = useTheme();
  const backgroundImage = useThemedAsset("/images/help-bg.webp", theme);
  const modalTextClassName = theme === "dark" ? "[&_.text-main]:text-alternative-dark" : "";
  const sharePanelTintClassName = theme === "dark" ? "bg-[#A58C66]" : "bg-[#FFD789]";
  const graphTrackTintClassName = theme === "dark" ? "bg-[#A58C66]" : "bg-[#FFD789]";
  const mainBackgroundClassName = theme === "dark" ? "bg-alternative-dark text-[#BC6131]" : "bg-main";
  const mainBorderClassName = theme === "dark" ? "border-alternative-dark" : "border-main";
  const buttonHoverClassName = theme === "dark" ? "hover:bg-[#984318]" : "hover:bg-[#9c4f26]";

  const [showStats, setShowStats] = useState(false);

  const playCloseSound = () => {
    if (!isMuted) {
      playSound("/sounds/modal.mp3");
    }
    onClose();
  };
  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); 
  };

  const maxGuesses = Math.max(...Object.values(storedStats.accuracy).slice(1), 1);
  const totalWins = storedStats.total > 0 ? storedStats.total - storedStats.accuracy[0] : 0;

  const winPercentage = storedStats.total > 0
    ? Math.round((totalWins / storedStats.total) * 100)
    : 0;

  const totalWinningGuesses = [1, 2, 3, 4, 5, 6].reduce((sum, num) => {
    return sum + (num * storedStats.accuracy[num]);
  }, 0);

  const averageGuesses = totalWins > 0
    ? (totalWinningGuesses / totalWins).toFixed(2)
    : 0;

  const statStyle = "text-2xl md:text-4xl font-bold";
  const statLabel = "text-md md:text-xl leading-none";
  
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-20 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50 z-0"
        onClick={playCloseSound}
      />

      <div
        className="relative max-w-[95vw] max-h-[95vh] w-full md:w-auto flex flex-col md:flex-row gap-2"
        style={{
          transform: `scale(${scaleFactor || 1})`,
          transformOrigin: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`justify-center align-middle relative z-10 overflow-y-auto p-8 py-4 md:py-8 ${modalTextClassName} ${scrollbarStyles}`}
          style={{
            backgroundImage: `url('${backgroundImage}')`,
            backgroundSize: "100% 100%",
          }}
        >
          <button
            onClick={playCloseSound}
            className="clickable absolute left-4 md:left-6 top-1 text-main text-4xl md:text-6xl hover:text-wrong z-20"
          >
            x
          </button>

          <div className="flex-1 flex flex-col justify-center min-w-0 md:min-w-[400px] h-full">
            <p className="text-main text-center text-2xl md:text-5xl font-bold md:mb-1">
              Next crop in: {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </p>

            <p className="text-center text-main text-md md:text-3xl mb-2">
              {correctGuesses ?? 0} out of {totalGuesses ?? 0} people have solved today's puzzle!
            </p>

            <p className={`${sharePanelTintClassName} mx-auto bg-opacity-60 border-2 ${mainBorderClassName} p-4 text-main text-md md:text-xl whitespace-pre text-center flex-wrap overflow-y-auto w-full ${scrollbarStyles}`}>
              {shareText}
            </p>

            <div className="md:mt-1 w-[80%] mx-auto flex items-center justify-center gap-2">
              <button
                onClick={handleCopy}
                className={`mt-4 clickable w-[75%] ${mainBackgroundClassName} text-white text-2xl md:text-4xl py-2 ${buttonHoverClassName} transition`}
              >
                {copied ? "Copied to Clipboard!" : "Share"}
              </button>

              <button
                onClick={() => {setShowStats(!showStats)}}
                className={`mt-4 clickable w-[25%] ${mainBackgroundClassName} text-white text-2xl md:text-4xl py-2 ${buttonHoverClassName} transition`}
              >
                {showStats ? "Hide" : "Stats"}
              </button>
            </div>
          </div>

        </div>
        {showStats && 
          <div
            className={`justify-center align-middle relative z-10 overflow-y-auto p-8 py-4 md:py-8 ${modalTextClassName} ${scrollbarStyles}`}
            style={{
              backgroundImage: `url('${backgroundImage}')`,
              backgroundSize: "100% 100%",
            }}
          >
            <div className="flex-1 flex flex-col justify-center min-w-0 md:min-w-[400px]">
              <h2 className="text-main text-center text-2xl md:text-5xl font-bold md:mb-1">
                Statistics
              </h2>

              <div className="grid grid-cols-4 gap-2 mb-3 text-main">
                <div className="text-center">
                  <div className={statStyle}>{storedStats.total}</div>
                  <div className={statLabel}>Played</div>
                </div>
                <div className="text-center">
                  <div className={statStyle}>{winPercentage}%</div>
                  <div className={statLabel}>Win Rate</div>
                </div>
                <div className="text-center">
                  <div className={statStyle}>{averageGuesses}</div>
                  <div className={statLabel}>Average</div>
                </div>
                <div className="text-center">
                  <div className={statStyle}>{storedStats.streak}</div>
                  <div className={statLabel}>Streak</div>
                </div>
              </div>

              <h2 className={`text-main text-center text-2xl md:text-4xl font-bold md:mb-1 pt-1 border-t-2 ${mainBorderClassName}`}>
                Guess Distribution
              </h2>

              <div className="flex flex-col gap-2 w-full pr-4">
                {[1, 2, 3, 4, 5, 6].map((num) => {
                  const count = storedStats.accuracy[num];
                  const widthPct = Math.max((count / maxGuesses) * 100, 8);

                  return (
                    <div key={num} className="flex items-center text-main text-base md:text-xl">
                      <span className="w-4 font-bold">{num}</span>
                      <div className={`flex-1 ml-3 ${graphTrackTintClassName} bg-opacity-40`}>
                        <div
                          className={`${mainBackgroundClassName} text-white text-right px-2 py-[2px] font-bold transition-all duration-500 ease-out`}
                          style={{ width: `${widthPct}%` }}
                        >
                          {count}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
        </div>}
      </div>
    </div>,
    document.body
  );
}