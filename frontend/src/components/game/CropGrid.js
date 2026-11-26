import CropCard from "./CropCard";
import { seasonSet } from "../../utils/cropCompare";
import { useTheme } from "../../context/ThemeContext";
import { useThemedAsset } from "../../hooks/useThemedAsset";

const HINT_KEYS = ["growth_time", "base_price", "regrows", "type", "season"];

// Mirrors the colour/arrow a guess row shows in GuessGrid for one attribute.
function feedback(key, guessValue, answerValue) {
  if (key === "season") {
    const guessed = seasonSet(guessValue);
    const correct = seasonSet(answerValue);

    if (guessed.size === correct.size && [...guessed].every((s) => correct.has(s))) {
      return "green";
    }
    return [...guessed].some((s) => correct.has(s)) ? "yellow" : "red";
  }

  if (key === "growth_time" || key === "base_price") {
    if (guessValue === answerValue) return "equal";
    return guessValue > answerValue ? "lower" : "higher";
  }

  return guessValue === answerValue ? "green" : "red";
}

// A crop is ruled out if it would have shown different feedback than the answer did on any guess row.
function isEliminated(crop, guesses, correctCrop, hints) {
  if (!correctCrop) return false;

  return guesses.some(({ crop: guess }) => {
    if (guess.name === crop.name) return true;

    return HINT_KEYS.some(
      (key) =>
        hints[key] &&
        feedback(key, guess[key], crop[key]) !== feedback(key, guess[key], correctCrop[key])
    );
  });
}

export default function CropGrid({
  selectedCrop,
  onSelect,
  isMuted,
  crops,
  isMobilePortrait,
  hints,
  guesses,
  correctCrop,
  disableMode,
  manualDisables,
  onToggleDisable,
}) {
  const { theme } = useTheme();

  const gridStyles = isMobilePortrait
    ? {
      gridTemplateColumns: "repeat(9, 66px)",
      gridAutoRows: "66px",
    }
    : {
      gridTemplateColumns: "repeat(8, 60px)",
      gridAutoRows: "60px",
    };

  const correctCropWasGuessed = correctCrop
    && guesses.some(({ crop: guess }) => guess.name === correctCrop.name);

  return (
    <div
      className={`flex justify-center items-center bg-center bg-no-repeat ${theme === "light"
        ? isMobilePortrait ? "-mt-[100px] w-[76%] h-[98%]" : "w-[90%] h-full"
        : isMobilePortrait ? "-mt-[64px] w-[84%] h-[112%]" : "w-[115%] h-[115%] -ml-2"
        }`}
      style={{
        backgroundImage: `url(${useThemedAsset(`/images/game/cropgrid-bg${isMobilePortrait ? "-mobile" : ""}.webp`, theme)})`,
        backgroundSize: isMobilePortrait
          ? "100% 100%"
          : "90% 81%",
      }}
    >
      <div
        className="grid gap-[6px] place-items-center"
        style={gridStyles}
      >
        {crops.map((crop) => {
          const hintEliminated = isEliminated(crop, guesses, correctCrop, hints);
          const manuallyDisabled = manualDisables.includes(crop.name);

          return (
            <CropCard
              key={crop.name}
              crop={crop}
              isCorrectCrop={correctCropWasGuessed && crop.name === correctCrop.name}
              isSelected={selectedCrop?.name === crop.name}
              onClick={disableMode ? onToggleDisable : onSelect}
              isMuted={isMuted}
              guessable={!hintEliminated && !manuallyDisabled}
              manuallyDisabled={manuallyDisabled}
              interactable={disableMode ? !hintEliminated : !hintEliminated && !manuallyDisabled}
              playClickSound={!disableMode}
              isMobilePortrait={isMobilePortrait}
            />
          );
        })}
      </div>
    </div>
  );
}
