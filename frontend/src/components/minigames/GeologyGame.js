import { useState, useMemo } from "react";
import { useGameData } from "../../context/GameDataContext";
import { useTheme } from "../../context/ThemeContext";
import { formatName } from "../../utils/formatString";
import { getSpriteStyle } from "../../utils/spriteUtils";
import { scrollbarStyles } from "../../utils/scrollbarStyles";
import { playSound } from "../../utils/playSound";
import { useThemedAsset } from "../../hooks/useThemedAsset";
import {
  getCorrectGuessOverlayClass,
  getWrongGuessOverlayClass,
} from "../../utils/guessFeedbackStyles";

import SpritePixelator from "./SpritePixelator";
import ThemedBackground, { MINIGAME_DARK_BACKGROUND_SCALE } from "./ThemedBackground";
import BundleIcon from "./BundleIcon";
import CustomButton from "../CustomButton";
import CursorTooltip from "../CursorTooltip";

const GEOLOGY_PIXEL_RESOLUTIONS = [4, 6, 8, 12, 14, 16];

export default function GeologyGame({ gameState, updateGameState, isMobilePortrait, isMuted }) {
    const { minerals, dailyData } = useGameData();
    const { theme } = useTheme();
    const titleTextClassName = theme === "dark" ? "text-alternative-dark" : "text-main";
    const listSelectorTextClassName = theme === "dark" ? "text-alternative-dark" : "text-main";
    const selectedFrame = useThemedAsset("/images/selected-frame.webp", theme);
    const guessesBackground = useThemedAsset("/images/game/guesses.webp", theme);
    const cropGridBackground = useThemedAsset("/images/game/cropgrid-bg.webp", theme);
    const minigameLargeBoxBackground = useThemedAsset("/images/minigames/boxLarge.webp", theme);
    const boxSquareBackground = useThemedAsset("/images/game/boxSquare.webp", theme);
    const nameBannerBackground = useThemedAsset("/images/name-banner.webp", theme);
    const buttonBaseBackground = useThemedAsset("/images/buttons/button-base.webp", theme);
    const wideTileBackground = useThemedAsset("/images/minigames/wideTile.webp", theme);
    const leftArrow = useThemedAsset("/images/arrow4L.webp", theme);
    const rightArrow = useThemedAsset("/images/arrow4R.webp", theme);

    const targetItemIndex = dailyData?.dailyItems?.geology;
    const targetItem = minerals?.[targetItemIndex];

    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedBlurLevelIndex, setSelectedBlurLevelIndex] = useState(null);
    const [showPicker, setShowPicker] = useState(false);
    const [showIcons, setShowIcons] = useState(false);
    const [activeTab, setActiveTab] = useState('A-C');


    if (!targetItem) return null;

    const currentGuesses = gameState.guesses || [];
    const maxGuesses = 6;

    const guessesMade = currentGuesses.length;
    const lastBlurLevelIndex = GEOLOGY_PIXEL_RESOLUTIONS.length - 1;
    const maxUnlockedBlurLevelIndex = gameState.complete
        ? lastBlurLevelIndex
        : Math.min(guessesMade, lastBlurLevelIndex);
    const activeBlurLevelIndex = Math.min(
        selectedBlurLevelIndex ?? maxUnlockedBlurLevelIndex,
        maxUnlockedBlurLevelIndex
    );
    const unguessedItems = useMemo(
        () => minerals.filter(item => !gameState.guesses.includes(item.name)),
        [minerals, gameState.guesses]
    );

    const ALPHABET_GROUPS = [
        { label: 'A-C', regex: /^[A-C]/i },
        { label: 'D-F', regex: /^[D-F]/i },
        { label: 'G-M', regex: /^[G-M]/i },
        { label: 'N-Q', regex: /^[N-Q]/i },
        { label: 'R-Z', regex: /^[R-Z]/i },
    ];

    const filteredMinerals = useMemo(
        () => unguessedItems.filter(item => {
            const activeRegex = ALPHABET_GROUPS.find(g => g.label === activeTab).regex;
            return activeRegex.test(item.name);
        }),
        [unguessedItems, activeTab]
    );

    const handleSubmit = () => {
        if (!selectedItem || gameState.complete) return;

        const isCorrect = selectedItem.name === targetItem.name;
        const newGuesses = [...currentGuesses, selectedItem.name];
        const hasLost = newGuesses.length >= maxGuesses && !isCorrect;
        const isComplete = gameState.complete || isCorrect || hasLost;

        updateGameState({
            ...gameState,
            guesses: newGuesses,
            win: gameState.win || isCorrect,
            complete: isComplete
        });
        setSelectedBlurLevelIndex(
            isComplete
                ? lastBlurLevelIndex
                : Math.min(newGuesses.length, lastBlurLevelIndex)
        );

        setSelectedItem(null);
        setShowPicker(false);

        if (!isMuted) {
            playSound(isCorrect ? "/sounds/reward.mp3" : "/sounds/sell.mp3");
        }
    };

    return (
        <div className={`flex items-center h-full md:gap-4 ${isMobilePortrait ? "flex-col w-full" : "flex-row"}`}>
            <div className={`flex flex-col justify-center items-center h-full p-4 relative gap-4 ${isMobilePortrait ? "w-full" : "w-1/2"}`}>
                <div
                    className="relative isolate z-10 w-[360px] md:w-[240px] aspect-[60/41]"
                >
                    <ThemedBackground
                        image={selectedFrame}
                        theme={theme}
                        scale={MINIGAME_DARK_BACKGROUND_SCALE.selectedFrame}
                    />
                    <BundleIcon icon="/images/minigames/bundleIcons/geologist.webp" theme={theme} />
                </div>
                <div
                    className="relative isolate flex flex-col justify-center items-center p-4 aspect-[5/3]"
                >
                    <ThemedBackground
                        image={guessesBackground}
                        theme={theme}
                        backgroundSize="contain"
                        scale={MINIGAME_DARK_BACKGROUND_SCALE.guesses}
                    />
                    <h3 className={`text-5xl ${titleTextClassName} pt-2 pb-2`}>What is this item?</h3>
                    <div className="relative flex h-[242px] w-[292px] items-center justify-center mb-4">
                        <button
                            type="button"
                            onClick={() => setSelectedBlurLevelIndex(activeBlurLevelIndex - 1)}
                            disabled={activeBlurLevelIndex === 0}
                            className={`absolute left-0 z-10 ${activeBlurLevelIndex === 0 ? "opacity-40 pointer-events-none" : "hover:brightness-125 clickable"}`}
                        >
                            <img src={leftArrow} className="scale-[6] md:scale-[4]" />
                        </button>
                        <div
                            className="relative flex h-[242px] w-[242px] items-center justify-center"
                            style={{
                                backgroundImage: `url('${minigameLargeBoxBackground}')`,
                                backgroundSize: "100% 100%",
                                backgroundPosition: "center",
                                backgroundRepeat: "no-repeat",
                            }}
                        >
                            <SpritePixelator
                                sheetName="geology"
                                colIndex={targetItem.index}
                                pixelResolution={GEOLOGY_PIXEL_RESOLUTIONS[activeBlurLevelIndex]}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedBlurLevelIndex(activeBlurLevelIndex + 1)}
                            disabled={activeBlurLevelIndex >= maxUnlockedBlurLevelIndex}
                            className={`absolute right-0 z-10 ${activeBlurLevelIndex >= maxUnlockedBlurLevelIndex ? "opacity-40 pointer-events-none" : "hover:brightness-125 clickable"}`}
                        >
                            <img src={rightArrow} className="scale-[6] md:scale-[4]" />
                        </button>
                    </div>
                </div>
            </div>

            <div className={`isolate flex flex-col justify-center items-center h-full p-4 md:pt-8 relative gap-4 ${isMobilePortrait ? "w-full" : "w-1/2"}`}>
                <ThemedBackground
                    image={cropGridBackground}
                    theme={theme}
                    backgroundSize="90% 90%"
                    scale={MINIGAME_DARK_BACKGROUND_SCALE.cropGrid}
                />
                <div className={`flex flex-wrap gap-2 items-center justify-center max-h-[50%] max-w-[75%] overflow-y-auto overflow-x-hidden ${scrollbarStyles} pb-8 px-8`}>
                    {currentGuesses.map((guess, idx) => {
                        const isCorrect = guess === targetItem.name;

                        const itemArray = Array.isArray(minerals) ? minerals : minerals || [];

                        const guessedObj = itemArray.find(item => item.name === guess);
                        const spriteIndex = guessedObj?.index ?? 0;
                        return (
                            <div
                                className="relative h-[108px] w-[108px] flex items-center justify-center"
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
                                    <div className="group w-[108px] h-[108px] flex items-center justify-center">
                                        <div
                                            style={getSpriteStyle("geology", spriteIndex, 0, 16, theme)}
                                            className="z-10 scale-[130%]"
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
                            ? formatName(targetItem.name)
                            : selectedItem
                                ? formatName(selectedItem.name)
                                : "Select an Item..."
                        }
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
                        <div className="flex gap-4 items-center pb-8">
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
                                <img src="/images/minigames/search.webp" className="scale-[2.5]" />
                                <div className="absolute inset-0 bg-white/50 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-[12px]" />
                            </button>

                            <CustomButton
                                variant="submit"
                                label="Submit"
                                icon={"/images/submit-button.webp"}
                                onClick={handleSubmit}
                                isMuted={isMuted}
                                className={!selectedItem ? "opacity-50 pointer-events-none" : ""}
                            >
                                <p className="text-main text-center text-3xl md:text-xl italic">Guesses left: {maxGuesses - currentGuesses.length}/{maxGuesses}</p>
                            </CustomButton>
                        </div>

                        {showPicker && (
                            <div className="absolute isolate w-[90%] h-[90%] p-8 z-50 flex flex-col">
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
                                    {ALPHABET_GROUPS.map(group => (
                                        <button
                                            key={group.label}
                                            onClick={() => setActiveTab(group.label)}
                                            className={`h-12 w-12 transition-colors bg-no-repeat bg-contain bg-center
                                            ${activeTab === group.label ? "brightness-150 pointer-events-none" : "hover:brightness-125 clickable"}`}
                                            style={{ backgroundImage: `url('${buttonBaseBackground}')` }}
                                        >
                                            <span className={`text-2xl whitespace-nowrap transition-colors ${activeTab === group.label ? (theme === "dark" ? "text-alternative-dark" : "text-[#88403F]") : "text-white"}`}>{group.label}</span>
                                        </button>
                                    ))}
                                    <CustomButton
                                        variant="icon"
                                        icon="/images/buttons/icons/hint.webp"
                                        showX={!showIcons}
                                        label="Toggle Hint Icons"
                                        isMuted={true}
                                        onClick={() => {
                                            setShowIcons(!showIcons);
                                        }}
                                        showLabel={true}
                                        isMobilePortrait={isMobilePortrait}
                                    />
                                </div>
                                <div className={`overflow-y-auto overflow-x-hidden flex-1 p-2 ${scrollbarStyles}`}>
                                    <div className={`flex flex-wrap gap-2 justify-center items-center px-2`}>
                                        {filteredMinerals.map(item => (
                                            <button
                                                key={item.name}
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setShowPicker(false);
                                                }}
                                                style={{
                                                    backgroundImage: `url('${wideTileBackground}')`,
                                                    backgroundSize: "100% 100%",
                                                    backgroundPosition: "center",
                                                    backgroundRepeat: "no-repeat",
                                                }}
                                                className={`p-2 font-bold ${listSelectorTextClassName} clickable relative w-[45%]`}
                                            >
                                                {selectedItem?.name === item.name &&
                                                    <div className={`absolute top-0 left-0 w-full h-full opacity-60 mix-blend-screen bg-yellow-100`} />
                                                }
                                                <div className="flex justify-start items-center gap-3 w-full h-12">
                                                    {showIcons && <div
                                                        style={{
                                                            ...getSpriteStyle("geology", item.index, 0, 16, theme),
                                                            filter: `grayscale(100%) brightness(50%)${theme === "dark" ? " brightness(90%)" : ""}`,
                                                        }}
                                                        className="scale-[87.5%]"
                                                    />}
                                                    <div className={`text-3xl md:text-xl font-medium ${listSelectorTextClassName} z-10 ${showIcons ? "w-2/3 text-left" : "w-full text-center"}`}>{item.name}</div>
                                                </div>
                                            </button>
                                        ))}

                                        {filteredMinerals.length === 0 && (
                                            <div className="col-span-full text-center text-main opacity-50 mt-4">
                                                No items found in this category.
                                            </div>
                                        )}
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