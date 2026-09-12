import { useEffect, useState } from "react";
import CollectionsCard from "./CollectionsCard";

export default function CollectionsGrid({ selectedCrop, onSelect, isMuted, isMobilePortrait, cropList }) {
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
      className={`flex justify-center items-center ${isMobilePortrait ? "w-full -mt-[92px] h-[98%]" : "w-[90%] h-full mt-[2px]"}`}
>
      <div
        className="grid gap-[6px] place-items-center border-r-[4px] border-t-[4px] border-[#FFF2D5] p-[2px]"
        style={gridStyles}
      >
        {cropList.map((crop) => (
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
