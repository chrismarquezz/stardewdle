import ReactDOM from "react-dom";
import { formatName } from "../utils/formatString";
import { scrollbarStyles } from "../utils/scrollbarStyles";

function ToggleHint({ hintName, hintValue, setHints, isMuted }) {
    let displayName = formatName(hintName);
    if (hintName === "growth_time") displayName = "Growth";
    if (hintName === "base_price") displayName = "Price";
    if (hintName === "regrows") displayName = "Regrow";

    return (
        <div className="flex flex-col items-center mb-2 space-y-1">
            <p className="text-center">{formatName(displayName)}</p>
            <div
                className={`group w-[30px] h-[30px] md:w-[50px] md:h-[50px] clickable z-10 transition-transform duration-200 hover:scale-110`}
                onClick={() => {
                    if (!isMuted) {
                        new Audio("/sounds/pluck.mp3").play();
                    }
                    setHints((prevHints => ({
                        ...prevHints,
                        [hintName]: !hintValue,
                    })));
                }}
            >
                <img
                    src={hintValue ? "/images/toggle-on.webp" : "/images/toggle-off.webp"}
                    alt={`Toggle ${hintName} Hint`}
                    className="w-full h-full"
                />
                <img
                    src={
                        hintValue
                            ? "/images/toggle-on-hover.webp"
                            : "/images/toggle-off-hover.webp"
                    }
                    alt={`Hover ${hintName} Hint`}
                    className="-translate-y-[100%] w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
                {/*<div
            className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 flex items-center justify-center text-lg font-medium text-[#BC6131] text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap"
            style={{
                backgroundImage: "url('/images/label.webp')",
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
                height: "28px",
            }}
        >
            {"Toggle Hints"}
        </div>*/}
            </div>
        </div>
    );
}

export default function HintsModal({ isMuted, onClose, scaleFactor, setHints, hints }) {
    const playCloseSound = () => {
        if (!isMuted) {
            new Audio("/sounds/modal.mp3").play();
        }
        onClose();
    };

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40"
            onClick={playCloseSound}
        >
            <div
                className="relative max-w-[95vw] max-h-[95vh] flex flex-col"
                style={{
                    transform: `scale(${scaleFactor})`,
                    transformOrigin: "center",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="justify-center align-middle relative z-10 flex flex-col overflow-y-auto p-4 md:pl-8 md:pr-8"
                    style={{
                        backgroundImage: "url('/images/help-bg.webp')",
                        backgroundSize: "100% 100%",
                    }}
                >
                    <button
                        onClick={playCloseSound}
                        className="clickable absolute top-0 left-3 md:left-6 text-[#BC6131] text-4xl md:text-7xl hover:text-red-500"
                    >
                        x
                    </button>

                    <h2 className="text-[#BC6131] text-center text-2xl md:text-5xl font-semibold mb-2">
                        Hints
                    </h2>

                    <div className={`space-y-2 md:space-y-4 text-[#BC6131] text-left text-md sm:text-2xl md:text-3xl leading-none overflow-y-auto max-h-[70vh] pr-2 mb-4 ${scrollbarStyles}`}>
                        <p>- Feeling stuck? Hints can help!</p>
                        <p>- Hints narrow down the possibilities based on your previous guesses</p>
                        <p>- If you get something wrong, the hints will eliminate those options</p>
                        <p>- If you get something right, the hints will eliminate all other options</p>
                        <p>- Below, you can toggle which hints you would like to be shown</p>

                        <div className="flex flex-row justify-center gap-6">
                            {Object.entries(hints).map((hint) => (
                                <ToggleHint
                                    key={hint[0]}
                                    hintName={hint[0]}
                                    hintValue={hint[1]}
                                    setHints={setHints}
                                    isMuted={isMuted}
                                />
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
