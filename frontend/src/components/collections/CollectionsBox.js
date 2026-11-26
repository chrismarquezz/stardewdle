import { useState, useEffect } from "react";
import { useSound } from "../../context/SoundContext";
import { useTheme } from "../../context/ThemeContext";
import { useGameData } from "../../context/GameDataContext";
import { formatName } from "../../utils/formatString";
import { playSound } from "../../utils/playSound";
import { utcDateString } from "../../utils/dateUtils";

import CollectionsGrid from "./CollectionsGrid";
import CollectionsModal from "./CollectionsModal";
import CropLoader from "../CropLoader";
import CustomButton from "../CustomButton";
import CursorTooltip from "../CursorTooltip";
import UpdatesModal from "../UpdatesModal";
import AccountMenu from "../auth/AccountMenu";

const CROP_COUNT_KEY = "stardewdle-cropCounts";

function getCachedCropCounts() {
  try {
    const cached = JSON.parse(localStorage.getItem(CROP_COUNT_KEY));
    if (cached?.date === utcDateString() && cached.counts) return cached.counts;
  } catch {
    localStorage.removeItem(CROP_COUNT_KEY);
  }
  return null;
}

export default function CollectionsBox({ isMobilePortrait }) {
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [cropCount, setCropCount] = useState(() => getCachedCropCounts() ?? {});

  const { isMuted, toggleMute } = useSound();
  const { theme, toggleTheme } = useTheme();
  const { crops, isReady, loadError, reloadGameData } = useGameData();
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);

  const {
    showUpdates,
    setShowUpdates,
    shouldPulse,
    handleOpenUpdates
  } = useGameData();

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
    if (getCachedCropCounts()) return;

    const controller = new AbortController();

    const fetchCount = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + "/count", { signal: controller.signal });
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        const counts = await res.json();
        localStorage.setItem(CROP_COUNT_KEY, JSON.stringify({ date: utcDateString(), counts }));
        setCropCount(counts);
      } catch (error) {
        if (!controller.signal.aborted) console.error("Failed to fetch crop counts:", error);
      }
    };

    fetchCount();
    return () => controller.abort();
  }, []);

  if (!isReady || crops.length === 0) {
    return <CropLoader error={loadError} onRetry={() => reloadGameData()} />;
  }

  const x_pos = parseInt(selectedCrop?.crop_index) / 71 * 100;

  const spriteStyle = {
    backgroundImage: 'var(--sprite-url)',
    backgroundPosition: `${x_pos}% 0%`,
    backgroundSize: '7200% 100%',
    imageRendering: 'pixelated',
    ...(theme === "dark" ? { filter: "brightness(90%)" } : {}),
  };

  return (
    <div
      className={`relative shadow-xl bg-no-repeat bg-center flex ${isMobilePortrait
        ? "flex-col-reverse items-center w-full"
        : "flex-row mt-3 justify-between w-full pl-3"
        }`}
      style={{
        backgroundImage: isMobilePortrait
          ? "url('/images/collections/collectionsBG-mobile.webp')"
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
                    <CursorTooltip label={formatName(selectedCrop.name)}>
                      <div
                        style={spriteStyle}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[60%] w-[60%] bg-no-repeat"
                      />
                    </CursorTooltip>
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
                      <CursorTooltip
                        key={season}
                        label={season.charAt(0).toUpperCase() + season.slice(1)}
                        backgroundImage="/images/collections/collectionsLabel.webp"
                        textClassName="text-[#c9ba98]"
                      >
                        <div className="relative group flex items-center justify-center gap-3">
                          <img
                            src={`/images/game/${season}.webp`}
                            alt={season}
                            className="h-8 w-12"
                          />
                        </div>
                      </CursorTooltip>
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
      <div className={`absolute -top-[60px] left-[10px]`}>
        <AccountMenu isMuted={isMuted} />
      </div>
      <div className={`absolute flex gap-[5px] -top-[60px] right-[10px]`}>
        <CustomButton
          variant="icon"
          icon="/images/buttons/icons/question-mark.webp"
          label={"Help"}
          isMuted={isMuted}
          onClick={() => {
            setShowCollectionsModal(true);
          }}
          showLabel={true}
          soundPath={"/sounds/modal.mp3"}
        />

        <CustomButton
          variant="icon"
          icon="/images/buttons/icons/volume.webp"
          showX={isMuted}
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
          icon="/images/buttons/icons/theme.webp"
          label={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          isMuted={isMuted}
          onClick={toggleTheme}
          showLabel={true}
        />

        <CustomButton
          variant="icon"
          icon="/images/buttons/icons/info.webp"
          label="Updates"
          isMuted={isMuted}
          onClick={handleOpenUpdates}
          shouldPulse={shouldPulse}
          showLabel={true}
          isMobilePortrait={isMobilePortrait}
          soundPath={"/sounds/modal.mp3"}
        />
      </div>
      {showCollectionsModal && (
        <CollectionsModal
          isMuted={isMuted}
          onClose={() => setShowCollectionsModal(false)}
        />
      )}
      {showUpdates && (
        <UpdatesModal
          isMuted={isMuted}
          onClose={() => setShowUpdates(false)}
        />
      )}
    </div>
  );
}
