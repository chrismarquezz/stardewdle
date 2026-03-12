import { useEffect, useState } from "react";
import CollectionsCard from "./CollectionsCard";

export default function CollectionsGrid({ selectedCrop, onSelect, isMuted, className, isMobilePortrait }) {
  const [crops, setCrops] = useState([]);

  useEffect(() => {
  if (crops.length === 0) {
    const fetchInitialData = async () => {
      try {
        const cropResponse = await fetch(process.env.REACT_APP_API_URL + "/crops");

        if (!cropResponse.ok) {
          throw new Error(`HTTP error! status: ${cropResponse.status}`);
        }

        const cropList = await cropResponse.json();
        setCrops(cropList);
      } catch (error) {
        console.error("Failed to fetch crop data from Lambda:", error);
      }
    };

    fetchInitialData();
  }
  }, [crops]);


  const gridStyles = isMobilePortrait
    ? {
      gridTemplateColumns: "repeat(9, 60px)",
      gridAutoRows: "60px",
    }
    : {
      gridTemplateColumns: "repeat(8, 60px)",
      gridAutoRows: "60px",
    };

  return (
    <div
      className={`flex justify-center items-center h-full w-[90%] mt-[2px] ${className}`}
    >
      <div
        className="grid gap-[6px] place-items-center border-r-[4px] border-t-[4px] border-[#FFF2D5] p-[2px]"
        style={gridStyles}

      >
        {crops.map((crop) => (
          <CollectionsCard
            key={crop.name}
            crop={crop}
            isSelected={selectedCrop?.name === crop.name}
            onClick={onSelect}
            isMuted={isMuted}
          />
        ))}
      </div>
    </div>
  );
}
