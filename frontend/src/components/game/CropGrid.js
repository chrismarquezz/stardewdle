import CropCard from "./CropCard";

const SEASONS = ["spring", "summer", "fall", "winter"];
const HINT_KEYS = ["growth_time", "base_price", "regrows", "type", "season"];

function seasonSet(value) {
  const seasons = Array.isArray(value) ? value : [value];
  return new Set(seasons.includes("all") ? SEASONS : seasons);
}

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

  const gridStyles = isMobilePortrait
    ? {
      gridTemplateColumns: "repeat(9, 66px)",
      gridAutoRows: "66px",
    }
    : {
      gridTemplateColumns: "repeat(8, 60px)",
      gridAutoRows: "60px",
    };

  return (
    <div
      className={`flex justify-center items-center ${isMobilePortrait ? "w-full -mt-[92px] h-[98%]" : "w-[90%] h-full"}`}
      style={{
        backgroundImage: `url('/images/game/cropgrid-bg${isMobilePortrait ? "-mobile.webp" : ".webp"}')`,
        backgroundSize: isMobilePortrait ? "100% 100%" : "90% 81%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
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
