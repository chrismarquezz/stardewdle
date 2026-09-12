import { formatName } from "../../utils/formatString";
import { scrollbarStyles } from "../../utils/scrollbarStyles";
import CustomModal from "../CustomModal";

import CustomButton from "../CustomButton";

function ToggleHint({ hintName, hintValue, setHints, isMuted }) {
    let displayName = formatName(hintName);
    if (hintName === "growth_time") displayName = "Growth";
    if (hintName === "base_price") displayName = "Price";
    if (hintName === "regrows") displayName = "Regrow";

    return (
        <div className="flex flex-col items-center mb-2 space-y-1">
            <p className="text-center">{formatName(displayName)}</p>
            <CustomButton
                variant="toggle"
                icon={hintValue ? "/images/game/toggle-on.webp" : "/images/game/toggle-off.webp"}
                label={`Toggle ${hintName} Hint`}
                isMuted={isMuted}
                onClick={() => {
                    setHints((prevHints => ({
                        ...prevHints,
                        [hintName]: !hintValue,
                    })));
                }}
            />
            
        </div>
    );
}

export default function HintsModal({ isMuted, onClose, scaleFactor, setHints, hints }) {
    return (
        <CustomModal title="Hints" isMuted={isMuted} onClose={onClose} scaleFactor={scaleFactor}>
            <div className={`space-y-2 md:space-y-4 text-main text-left text-md sm:text-2xl md:text-3xl leading-none overflow-y-auto max-h-[70vh] pr-2 mb-4 ${scrollbarStyles}`}>
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
        </CustomModal>
    );
}
