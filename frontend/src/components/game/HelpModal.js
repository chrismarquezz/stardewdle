import { useState } from "react";

import { scrollbarStyles } from "../../utils/scrollbarStyles";
import CustomModal from "../CustomModal";

export default function HelpModal({ isMuted, onClose, scaleFactor }) {
  const [first, setFirst] = useState(true);

  const pageToggle = (
    <>
      <button
        onClick={() => setFirst(true)}
        disabled={first}
        className={`absolute top-6 md:top-10 right-12 md:right-24 ${first ? "opacity-50 pointer-events-none" : "hover:brightness-150 clickable"}`}
      >
        <img src="/images/arrow4L.webp" className="scale-[2] md:scale-[4]" />
      </button>

      <button
        onClick={() => setFirst(false)}
        disabled={!first}
        className={`absolute top-6 md:top-10 right-6 md:right-14 ${!first ? "opacity-50 pointer-events-none" : "hover:brightness-150 clickable"}`}
      >
        <img src="/images/arrow4R.webp" className="scale-[2] md:scale-[4]" />
      </button>
    </>
  );

  return (
    <CustomModal
      title="How to Play"
      isMuted={isMuted}
      onClose={onClose}
      scaleFactor={scaleFactor}
      headerContent={pageToggle}
    >
      {first ? (
            <div className={`space-y-2 md:space-y-4 text-main text-left text-md sm:text-2xl md:text-3xl leading-none overflow-y-auto max-h-[70vh] max-w-[900px] pr-2 mb-4 ${scrollbarStyles}`}>
              <p>- Select a crop from the grid</p>
              <p>- Click "Submit" to guess the crop of the day</p>
              <p>- You get 6 tries to guess correctly</p>

              <div>
                <p>- The result grid shows feedback:</p>
                <div className="flex flex-row items-center gap-4 md:gap-10 text-nowrap">
                  <div className="ml-6 md:ml-10 mt-2 md:mt-4 space-y-3 md:space-y-5">
                    <div className="flex items-center gap-2 md:gap-4">
                      <div className="w-4 h-4 md:w-8 md:h-8 bg-cyan-500 border md:border-2 border-cyan-600 rounded-sm mix-blend-multiply opacity-90" />
                      <span>Exact match</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                      <div className="w-4 h-4 md:w-8 md:h-8 bg-amber-300 border md:border-2 border-amber-400 rounded-sm mix-blend-multiply opacity-90" />
                      <span>Partial match</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                      <div className="w-4 h-4 md:w-8 md:h-8 bg-red-700 border md:border-2 border-red-800 rounded-sm mix-blend-multiply opacity-90" />
                      <span>Incorrect</span>
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-5">
                    <div className="flex items-center gap-2 md:gap-4">
                      <img
                        src="/images/game/arrow4U.webp"
                        alt="Up Arrow"
                        className="w-4 h-2 md:w-8 md:h-4"
                      />
                      <span>The correct value is higher</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                      <img
                        src="/images/game/arrow4D.webp"
                        alt="Down Arrow"
                        className="w-4 h-2 md:w-8 md:h-4"
                      />
                      <span>The correct value is lower</span>
                    </div>
                  </div>
                </div>
              </div>
              <p>- Hover over the season image to see the season name</p>
              <p>
                - If you ever feel stuck, use the hint feature to narrow down your options
              </p>
            </div>
          ) : (
            <div className={`space-y-2 md:space-y-4 text-main text-left text-md sm:text-2xl md:text-3xl leading-none overflow-y-auto max-h-[70vh] max-w-[900px] pr-2 mb-4 ${scrollbarStyles}`}>
              <p>How crops have been chosen and categorized:</p>
                <p>- Almost all crop data is taken from the official <a href="https://stardewvalleywiki.com/Crops" className="underline clickable">Stardew Valley Wiki</a></p>
              <p>- This is why Tomato, Hot Pepper, and Rhubarb are categorized as they are</p>
              <p>- Similarly, while some crops may be forageable, the game may list them as fruits and flowers, not forages </p>
              <p>- Sweet Gem Berry and Coffee Bean are not listed under any category, so we have chosen to label them as fruits (these are the only ones we modified)</p>
              <p>- Only the first cycle of regrowable crops is used</p>
              <p>- Common Mushroom and Grapes use the more common way they are grown</p>
              <p>- Other mushrooms are considered to be grown from the mushroom log</p>
              <p>- Crops have a week-long period in which they cannot be chosen again</p>
            </div>
          )}
    </CustomModal>
  );
}
