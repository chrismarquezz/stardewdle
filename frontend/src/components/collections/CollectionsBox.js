import { useState, useEffect } from "react";
import { useSound } from "../../context/SoundContext";
import { useGameData } from "../../context/GameDataContext"; // Import the hook
import { formatName } from "../../utils/formatString";
import { playSound } from "../../utils/playSound";

import CollectionsGrid from "./CollectionsGrid";
import CollectionsModal from "./CollectionsModal";
import CropLoader from "../CropLoader";
import CustomButton from "../CustomButton";

export default function CollectionsBox({ isMobilePortrait }) {
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [cropCount, setCropCount] = useState([]);

  const { isMuted, toggleMute } = useSound();
  const { crops, isReady } = useGameData();
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);

  useEffect(() => {
    const hasSeenCollectionsModal = localStorage.getItem(
      "stardewdle-hasSeenCollectionsModal"
    );
    if (!hasSeenCollectionsModal) {
      setShowCollectionsModal(true);
      localStorage.setItem("stardewdle-hasSeenCollectionsModal", "true");
    }
  }, []);

  useEffect(() => {
    const fetchCount = async () => {
      const res = await fetch(import.meta.env.VITE_API_URL + "/count");
      const countList = await res.json();
      setCropCount(countList);
    };
    fetchCount();
  }, []);

  if (!isReady || crops.length === 0) {
    return <CropLoader />;
  }

  const x_pos = parseInt(selectedCrop?.crop_index) / 71 * 100;

  const spriteStyle = {
    backgroundImage: 'var(--sprite-url)',
    backgroundPosition: `${x_pos}% 0%`,
    backgroundSize: '7200% 100%',
    imageRendering: 'pixelated',
  };

  return (
    <div
      className={`relative shadow-xl bg-no-repeat bg-center flex ${isMobilePortrait
        ? "flex-col-reverse items-center w-full"
        : "flex-row mt-3 justify-between w-full pl-3"
        }`}
      style={{
        backgroundImage: isMobilePortrait
          ? "url('/images/collections/collectionsBG-mobile.jpg')"
          : "url('/images/collections/collectionsBG.webp')",
        backgroundSize: "100% 100%",
        width: isMobilePortrait ? "940px" : "1600px",
        height: isMobilePortrait ? "1500px" : "800px",
      }}
    >
      <div
        className={
          isMobilePortrait
            ? "flex justify-center items-center h-full pt-[80px]"
            : "relative flex flex-row mt-3 justify-center w-full pl-3"
        }
      >
        <CollectionsGrid
          selectedCrop={selectedCrop}
          onSelect={setSelectedCrop}
          crops={crops}
          isMuted={isMuted}
          isMobilePortrait={isMobilePortrait}
          cropList={crops}
        />
      </div>
      <div className="flex flex-col align-center w-full place-items-center h-full justify-center ">
        <div
          className={`flex flex-col items-center ${isMobilePortrait ? "mt-12" : "mr-12 mt-[20px]"} gap-4`}
        >
          {selectedCrop ? (
            <>
              <div className="text-7xl text-center text-[#c9ba98]">
                {formatName(selectedCrop.name)}
                <div className="w-[500px] border-b-4 border-[#c9ba98] mx-auto text-4xl text-center text-[#c9ba98] pb-2">
                  {selectedCrop.infodetail}
                </div>
              </div>
              <div className="flex flex-row items-center h-full mr-10 gap-4">
                <div
                  className="relative bg-no-repeat bg-contain"
                  style={{
                    backgroundImage:
                      "url('/images/collections/collectionsSelected.webp')",
                    width: "212px",
                    height: "212px",
                  }}
                >
                  {selectedCrop && (
                    <div
                      style={spriteStyle}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[60%] w-[60%] bg-no-repeat"
                      title={selectedCrop.name}
                    />
                  )}
                </div>
                <div className="text-4xl text-center text-[#c9ba98] tracking-wide">
                  {formatName(selectedCrop.type)} <br />
                  Sells for {selectedCrop.base_price}g <br />
                  Grows in {selectedCrop.growth_time} days <br />
                  Does {selectedCrop.regrows ? "" : "not"} regrow <br />
                  <div className="flex gap-3 items-center justify-center">
                    {"Seasons: "}{" "}
                    {(selectedCrop.season[0] === "all"
                      ? ["spring", "summer", "fall", "winter"]
                      : Array.isArray(selectedCrop.season)
                        ? selectedCrop.season.map((s) => s.toLowerCase())
                        : []
                    ).map((season) => (
                      <div
                        key={season}
                        className="relative group flex items-center justify-center gap-3"
                      >
                        <img
                          src={`/images/${season}.webp`}
                          alt={season}
                          className="h-8 w-12"
                        />
                        <div
                          className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 flex items-center justify-center text-xl font-medium text-[#c9ba98] text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap"
                          style={{
                            backgroundImage:
                              "url('/images/collections/collectionsLabel.webp')",
                            backgroundSize: "100% 100%",
                            backgroundRepeat: "no-repeat",
                            height: "28px",
                          }}
                        >
                          {season.charAt(0).toUpperCase() + season.slice(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="w-[500px] border-t-4 border-[#c9ba98] mx-auto text-4xl text-center text-[#c9ba98] pt-2">
                Crop has appeared {cropCount[selectedCrop.name]} time
                {cropCount[selectedCrop.name] === 1 ? "" : "s"}
              </div>
            </>
          ) : (
            <div className="text-5xl text-center text-[#c9ba98]">
              Select a crop to see its details
            </div>
          )}
        </div>
      </div>
      <div
        className={`absolute flex gap-[5px] -top-[60px] right-[10px]`}
      >
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
        />
        
        <CustomButton
          variant="icon"
          icon={"/images/question-mark.webp"}
          label={"Help"}
          isMuted={isMuted}
          onClick={() =>  setShowCollectionsModal(true)}
          showLabel={true}
          soundPath={"/sounds/modal.mp3"}
        />
      </div>
      {showCollectionsModal && (
        <CollectionsModal
          isMuted={isMuted}
          onClose={() => setShowCollectionsModal(false)}
        />
      )}
    </div>
  );
}
