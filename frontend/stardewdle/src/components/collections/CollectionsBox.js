import { useState, useEffect } from "react";
import { useSound } from "../../context/SoundContext";
import CollectionsGrid from "./CollectionsGrid";
import CollectionsModal from "./CollectionsModal";
import CropLoader from "../CropLoader";
import { formatName } from "../../utils/formatString";

export default function CollectionsBox({ isMobilePortrait }) {
  const [selectedCrop, setSelectedCrop] = useState(null);

  const [crops, setCrops] = useState([]);
  const [cropCount, setCropCount] = useState([]);
  const { isMuted, toggleMute } = useSound();
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
    if (crops.length === 0) {
      const fetchInitialData = async () => {
        try {
          const cropResponse = await fetch(
            `${process.env.REACT_APP_BUCKET_URL}/data/crops.json`
          );

          if (!cropResponse.ok) {
            throw new Error(`HTTP error! status: ${cropResponse.status}`);
          }

          const cropList = await cropResponse.json();
          setCrops(cropList);
        } catch (error) {
          console.error("Failed to fetch crop data from R2:", error);
        }

        try {
          const countResponse = await fetch(
            process.env.REACT_APP_API_URL + "/count"
          );

          if (!countResponse.ok) {
            throw new Error(`HTTP error! status: ${countResponse.status}`);
          }

          const countList = await countResponse.json();
          setCropCount(countList);
        } catch (error) {
          console.error("Failed to fetch crop data from Lambda /count:", error);
        }
      };

      fetchInitialData();
    }
  }, [crops]);

  if (crops.length === 0) {
    return (
      <CropLoader
        className={isMobilePortrait ? "content-counter-rotate-mobile" : ""}
      />
    );
  }

  const x_pos = parseInt(selectedCrop?.crop_index) / 71 * 100;

  const spriteStyle = {
    backgroundImage: `url('${process.env.REACT_APP_BUCKET_URL}/sprites/crops.png')`,
    backgroundPosition: `${x_pos}% 0%`,
    backgroundSize: '7200% 100%',
    imageRendering: 'pixelated',
  };

  return (
    <div
      className={`relative shadow-xl bg-no-repeat bg-center ${isMobilePortrait
        ? "collections-box-mobile-layout"
        : "relative flex flex-row mt-3 justify-between w-full pl-3"
        }`}
      style={{
        backgroundImage: "url('/images/collections/collectionsBG.webp')",
        backgroundSize: "100% 100%",
        width: isMobilePortrait ? "1500px" : "1600px",
        height: isMobilePortrait ? "940px" : "800px",
      }}
    >
      <div
        className={
          isMobilePortrait
            ? "mobile-collections-grid-wrapper content-counter-rotate-mobile"
            : "relative flex flex-row bg-no-repeat mt-3 justify-center w-full pl-3"
        }
      >
        <CollectionsGrid
          selectedCrop={selectedCrop}
          onSelect={setSelectedCrop}
          crops={crops}
          isMuted={isMuted}
          className={isMobilePortrait ? "content-counter-rotate-mobile" : ""}
          isMobilePortrait={isMobilePortrait}
        />
      </div>
      <div
        className={`flex flex-col align-center w-full place-items-center h-full justify-center ${isMobilePortrait ? "content-counter-rotate-mobile" : ""
          }`}
      >
        <div
          className={`flex flex-col items-center ${isMobilePortrait ? "" : "mr-12 mt-[20px]"
            } gap-4`}
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
      <div className={`absolute ${isMobilePortrait ? "h-[50px] w-[110px] bottom-[50px] -right-[90px] content-counter-rotate-mobile" : "-top-[10px] right-[10px]"} `}>
        <div
          className={`group absolute w-[50px] h-[50px] clickable z-10 transition-transform duration-200 hover:scale-110 bottom-[0px] right-[55px]`}
          onClick={() => {
            if (isMuted) {
              new Audio("/sounds/pluck.mp3").play();
            }
            toggleMute();
          }}
        >
          <img
            src={isMuted ? "/images/muted.webp" : "/images/unmuted.webp"}
            alt="Toggle Sound"
            className="w-full h-full"
          />
          <img
            src={
              isMuted ? "/images/muted-hover.webp" : "/images/unmuted-hover.webp"
            }
            alt="Sound Hover"
            className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          />
          <div
            className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 flex items-center justify-center text-lg font-medium text-[#BC6131] text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap"
            style={{
              backgroundImage: "url('/images/label.webp')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              height: "28px",
            }}
          >
            {"Mute/Unmute"}
          </div>
        </div>
        <div
          className={`group absolute w-[50px] h-[50px] clickable z-10 transition-transform duration-200 hover:scale-110 bottom-[0px] right-[0px]`}
          onClick={() => {
            if (!isMuted) {
              new Audio("/sounds/modal.mp3").play();
            }
            setShowCollectionsModal(true);
          }}
        >
          <img
            src="/images/question-mark.webp"
            alt="Collections Modal"
            className="w-full h-full"
          />
          <img
            src="/images/question-mark-hover.webp"
            alt="Collections Modal Hover"
            className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          />
          <div
            className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 flex items-center justify-center text-lg font-medium text-[#BC6131] text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap"
            style={{
              backgroundImage: "url('/images/label.webp')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              height: "28px",
            }}
          >
            {"Help"}
          </div>
        </div>
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
