import { useEffect, useState } from "react";
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
  className,
  isMobilePortrait,
  constraints,
  hints,
}) {
  const [crops, setCrops] = useState([]);

  useEffect(() => {
    if (crops.length === 0) {
      const fetchInitialData = async () => {
        try {
          const version = "1.0.1";
          const cropResponse = await fetch(
            `${process.env.REACT_APP_BUCKET_URL}/data/crops.json?v=${version}`
          );

          if (!cropResponse.ok) {
            throw new Error(`HTTP error! status: ${cropResponse.status}`);
          }

          const cropList = await cropResponse.json();
          
          setCrops(cropList);

        } catch (error) {
          console.error("Failed to fetch crop data from R2:", error);
        }
      };

      fetchInitialData();
    }
  }, [crops]);


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
      className={`flex justify-center items-center h-full w-[90%] mt-[2px] ${className}`}
      style={{
        backgroundImage: "url('/images/cropgrid-bg.webp')",
        backgroundSize: isMobilePortrait ? "100% 100%" : "90% 80%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className={`grid gap-[6px] place-items-center ${isMobilePortrait ? "content-counter-rotate-mobile" : ""}`}
        style={gridStyles}
      >
        {crops.map((crop) => (
          <CropCard
            key={crop.name}
            crop={crop}
            isSelected={selectedCrop?.name === crop.name}
            onClick={onSelect}
            isMuted={isMuted}
            guessable={!checkConstraints(constraints, crop, hints)}
            isMobilePortrait={isMobilePortrait}
          />
        ))}
      </div>
    </div>
  );
}
