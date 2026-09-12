import CropCard from "./CropCard";

function checkConstraints(constraints, crop, hints) {
  const allConstraintsEmpty = Object.values(constraints).every(arr => arr.length === 0);
  if (allConstraintsEmpty) {
    return false;
  }

  for (const key in constraints) {
    const constraintValues = constraints[key];
    const cropValue = crop[key];

    if (constraintValues.length === 0 || !hints[key]) {
      continue;
    }

    let isMatch = false;

    if (key === 'season' && Array.isArray(cropValue)) {
      if (cropValue[0] === "all")
        isMatch = true;
      else {
        isMatch = constraintValues.some(constraintArr => {
          if (Array.isArray(constraintArr))
            return constraintArr.every(season => cropValue.includes(season))
          return constraintArr === cropValue[0]
        }
        );
      }
    } else if (key === "growth_time" || key === "base_price") {
      isMatch = cropValue <= constraintValues[0] || cropValue >= constraintValues[1];
    } else {
      isMatch = constraintValues.includes(cropValue);
    }

    if (isMatch) {
      return true;
    }
  }

  return constraints["name"].includes(crop.name);
}


export default function CropGrid({
  selectedCrop,
  onSelect,
  isMuted,
  crops,
  isMobilePortrait,
  constraints,
  hints,
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
          const hintEliminated = checkConstraints(constraints, crop, hints);
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
