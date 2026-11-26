import { useState, useMemo } from "react";
import { GameDataProvider, useGameData } from "../../context/GameDataContext";
import { useTheme } from "../../context/ThemeContext";
import { formatName } from "../../utils/formatString";
import { scrollbarStyles } from "../../utils/scrollbarStyles";
import { getSpriteStyle } from "../../utils/spriteUtils";
import { playSound } from "../../utils/playSound";
import { useThemedAsset } from "../../hooks/useThemedAsset";
import {
  getCorrectGuessOverlayClass,
  getWrongGuessOverlayClass,
} from "../../utils/guessFeedbackStyles";

import CustomButton from "../CustomButton";
import CursorTooltip from "../CursorTooltip";
import ThemedBackground, { MINIGAME_DARK_BACKGROUND_SCALE } from "./ThemedBackground";
import BundleIcon from "./BundleIcon";

export default function CookingGame({ gameState, updateGameState, isMobilePortrait, isMuted }) {
    const { cooking, dailyData } = useGameData();
    const { theme } = useTheme();
    const titleTextClassName = theme === "dark" ? "text-alternative-dark" : "text-main";
    const listSelectorTextClassName = theme === "dark" ? "text-alternative-dark" : "text-main";

    const targetFoodIndex = dailyData?.dailyItems?.cooking;
    const targetFood = cooking?.foods?.[targetFoodIndex];

    const [selectedFood, setSelectedFood] = useState(null);
    const [showPicker, setShowPicker] = useState(false);
    const [viewMode, setViewMode] = useState("grid");
    const selectedFrame = useThemedAsset("/images/selected-frame.webp", theme);
    const guessesBackground = useThemedAsset("/images/game/guesses.webp", theme);
    const cropGridBackground = useThemedAsset("/images/game/cropgrid-bg.webp", theme);
    const boxSquareBackground = useThemedAsset("/images/game/boxSquare.webp", theme);
    const nameBannerBackground = useThemedAsset("/images/name-banner.webp", theme);
    const minigameCardBackground = useThemedAsset("/images/minigames/minigameCard.webp", theme);
    const tileBackground = useThemedAsset(
        viewMode === "grid" ? "/images/game/tile-bg.webp" : "/images/minigames/wideTile.webp",
        theme
    );

    const maxGuesses = 6;

    const unguessedFoods = useMemo(
        () => cooking?.foods?.filter(food => !gameState.guesses.includes(food.name)) ?? [],
        [cooking, gameState.guesses]
    );

    const masterIngredientList = useMemo(() => {
        if (!cooking) return [];

        const foodsArray = Array.isArray(cooking) ? cooking : cooking.foods || [];

        const uniqueIngredients = new Set();
        foodsArray.forEach(food => {
            if (food.ingredients) {
                Object.keys(food.ingredients).forEach(ingName => uniqueIngredients.add(ingName));
            }
        });

        return Array.from(uniqueIngredients).sort((a, b) => a.localeCompare(b));
    }, [cooking]);

    const handleSubmit = () => {
        if (!selectedFood || gameState.complete) return;

        const isCorrect = selectedFood.name === targetFood.name;
        const newGuesses = [...gameState.guesses, selectedFood.name];

        updateGameState({
            ...gameState,
            guesses: newGuesses,
            win: gameState.win || isCorrect,
            complete: gameState.complete || isCorrect || newGuesses.length >= maxGuesses
        });

        setSelectedFood(null);
        setShowPicker(false);
        if (!isMuted) playSound(isCorrect ? "/sounds/reward.mp3" : "/sounds/sell.mp3");
    };

    return (
      <div
        className={`flex items-center h-full md:gap-4 ${isMobilePortrait ? "flex-col w-full" : "flex-row"} `}
      >
        <div
          className={`flex flex-col justify-center items-center h-full p-4 relative gap-4 ${isMobilePortrait ? "w-full" : "w-1/2"}`}
        >
          <div
            className="relative isolate z-10 w-[360px] md:w-[240px] aspect-[60/41]"
          >
            <ThemedBackground
              image={selectedFrame}
              theme={theme}
              scale={MINIGAME_DARK_BACKGROUND_SCALE.selectedFrame}
            />
            <BundleIcon icon="/images/minigames/bundleIcons/homeCook.webp" theme={theme} />
          </div>
          <div
            className="relative isolate flex flex-col justify-center items-center p-8 md:p-4 aspect-[5/3] w-[95%]"
          >
            <ThemedBackground
              image={guessesBackground}
              theme={theme}
              backgroundSize="contain"
              scale={MINIGAME_DARK_BACKGROUND_SCALE.guesses}
            />
            <h3 className={`text-5xl ${titleTextClassName} pb-8 md:pb-4`}>
              Ingredients Needed:
            </h3>
            <div className={`flex flex-row gap-24 md:gap-8 pt-6 pb-[120px] md:pt-0 md:pb-0 px-16 md:px-4 overflow-x-auto md:overflow-visible min-w-[25%] md:min-w-full max-w-full md:justify-center items-center ${scrollbarStyles}`}>
              {Object.entries(targetFood.ingredients).map(
                ([ingName, count]) => {
                  const ingredientIndex = masterIngredientList.indexOf(ingName);

                  return (
                    <div
                      key={ingName}
                      className="relative flex flex-col justify-center items-center p-2 md:w-1/5"
                    >
                      <div
                        className={`w-18 h-18 p-1 flex items-center justify-center`}
                        style={{
                          backgroundImage: `url('${minigameCardBackground}')`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          scale: isMobilePortrait ? "2" : "1.5",
                        }}
                      >
                        <div
                          style={getSpriteStyle("cooking", ingredientIndex, 0, 16, theme)}
                          className="w-full h-full z-10 scale-[87.5%]"
                        />
                      </div>

                      <div className="absolute top-[100px] md:top-20 text-4xl md:text-xl font-medium text-main text-center leading-none w-[180px] md:w-[100px]">
                        {count}x {formatName(ingName)}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>
        <div
          className={`isolate flex flex-col justify-center items-center h-full p-4 relative gap-4 ${isMobilePortrait ? "w-full" : "w-1/2"}`}
        >
          <ThemedBackground
            image={cropGridBackground}
            theme={theme}
            backgroundSize="90% 90%"
            scale={MINIGAME_DARK_BACKGROUND_SCALE.cropGrid}
          />
          <div
            className={`flex flex-wrap gap-2 items-center justify-center max-h-[50%] max-w-[50%] md:max-w-[60%] overflow-y-auto overflow-x-hidden ${scrollbarStyles} pb-8 px-10`}
          >
            {gameState.guesses.map((guess, idx) => {
              const isCorrect = guess === targetFood.name;

              const foodsArray = Array.isArray(cooking)
                ? cooking
                : cooking?.foods || [];

              const guessedFoodObj = foodsArray.find(
                (item) => item.name === guess,
              );
              const spriteIndex = guessedFoodObj?.index ?? 0;
              return (
                <div
                  className="relative h-[72px] w-[72px] flex items-center justify-center"
                  style={{
                    backgroundImage: `url('${boxSquareBackground}')`,
                    backgroundSize: "100% 100%",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                  key={idx}
                >
                  <div
                    className={`w-[75%] h-[75%] absolute z-0 opacity-90 ${isCorrect ? getCorrectGuessOverlayClass(theme) : getWrongGuessOverlayClass(theme)}`}
                  />
                  <CursorTooltip label={formatName(guess)}>
                    <div className="group w-[63px] h-[63px] flex items-center justify-center">
                      <div
                        style={getSpriteStyle("cooking", spriteIndex, 1, 16, theme)}
                        className="z-10 scale-[87.5%]"
                      />
                    </div>
                  </CursorTooltip>
                </div>
              );
            })}
          </div>

          <div
            className="flex items-center justify-center bg-center bg-no-repeat bg-contain"
            style={{
              backgroundImage: `url('${nameBannerBackground}')`,
              width: "416px",
              height: "76px",
            }}
          >
            <p className={`text-5xl text-center ${titleTextClassName} tracking-wide`}>
              {gameState.complete
                ? formatName(targetFood.name)
                : selectedFood
                  ? formatName(selectedFood.name)
                  : "Select a Food..."}
            </p>
          </div>

          {gameState.complete ? (
            <div className="text-5xl font-bold">
              {gameState.win ? (
                <span className="text-correct">Bundle Completed!</span>
              ) : (
                <span className="text-wrong">Out of guesses!</span>
              )}
            </div>
          ) : (
            <>
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => setShowPicker(!showPicker)}
                  className="group relative h-[72px] w-[72px] flex items-center justify-center clickable"
                  style={{
                    backgroundImage: `url('${boxSquareBackground}')`,
                    backgroundSize: "100% 100%",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  {selectedFood ? (
                    <CursorTooltip label={formatName(selectedFood.name)}>
                      <div
                        style={getSpriteStyle("cooking", selectedFood.index, 1, 16, theme)}
                        className="z-10 scale-[87.5%] clickable"
                      />
                    </CursorTooltip>
                  ) : (
                    <img
                      src="/images/minigames/search.webp"
                      className="scale-[2.5]"
                    />
                  )}
                  <div className="absolute inset-0 bg-white/50 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-[12px]" />
                </button>

                <CustomButton
                  variant="submit"
                  label="Submit"
                  icon={"/images/submit-button.webp"}
                  onClick={handleSubmit}
                  isMuted={isMuted}
                  className={
                    !selectedFood ? "opacity-50 pointer-events-none" : ""
                  }
                >
                  <p className="text-main text-center text-3xl md:text-xl italic">
                    Guesses left: {maxGuesses - gameState.guesses.length}/
                    {maxGuesses}
                  </p>
                </CustomButton>
              </div>

              {showPicker && (
                <div
                  className="absolute isolate w-[90%] h-[90%] p-8 z-50 flex flex-col"
                >
                  <ThemedBackground
                    image={cropGridBackground}
                    theme={theme}
                    scale={MINIGAME_DARK_BACKGROUND_SCALE.cropGrid}
                  />
                  <div className="flex justify-between mb-2 pb-2 border-b-2 border-main">
                    <CustomButton
                      variant="share"
                      icon="/images/minigames/arrowBack.webp"
                      label="Close"
                      isMuted={true}
                      onClick={() => {
                        setShowPicker(false);
                      }}
                      isMobilePortrait={isMobilePortrait}
                    />
                    <CustomButton
                      variant="icon"
                      icon={`/images/buttons/icons/${viewMode === "grid" ? "list" : "grid"}.webp`}
                      label={`Toggle ${viewMode === "grid" ? "List" : "Grid"} View`}
                      isMuted={isMuted}
                      onClick={() =>
                        setViewMode((v) => (v === "grid" ? "list" : "grid"))
                      }
                      showLabel={true}
                      isMobilePortrait={isMobilePortrait}
                    />
                  </div>

                  <div
                    className={`overflow-y-auto overflow-x-hidden flex-1 p-2 ${scrollbarStyles}`}
                  >
                    <div
                      className={`flex flex-wrap gap-2 justify-center items-center px-4`}
                    >
                      {unguessedFoods.map((food) => (
                        <button
                          key={food.name}
                          onClick={() => {
                            setSelectedFood(food);
                            setShowPicker(false);
                          }}
                          style={{
                            backgroundImage: `url('${tileBackground}')`,
                            backgroundSize: "100% 100%",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                          }}
                          className={`p-2 font-bold ${viewMode === "list" ? listSelectorTextClassName : "text-main"} clickable relative
                                                ${viewMode === "grid" ? "" : "w-[45%]"}`}
                        >
                          {selectedFood?.name === food.name && (
                            <div
                              className={`absolute top-0 left-0 w-full h-full opacity-60 mix-blend-screen bg-yellow-100`}
                            />
                          )}
                          {viewMode === "grid" ? (
                            <div className="relative group flex flex-col items-center">
                              <CursorTooltip label={formatName(food.name)}>
                                <div
                                  style={getSpriteStyle("cooking", food.index, 1, 16, theme)}
                                  className="scale-[87.5%]"
                                />
                              </CursorTooltip>
                            </div>
                          ) : (
                            <div className="flex justify-start items-center gap-3 w-full">
                              <div
                                style={getSpriteStyle("cooking", food.index, 1, 16, theme)}
                                className="scale-[87.5%]"
                              />
                              <div className={`w-3/5 text-3xl md:text-xl font-medium ${listSelectorTextClassName} text-left leading-none z-10`}>
                                {formatName(food.name)}
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
}