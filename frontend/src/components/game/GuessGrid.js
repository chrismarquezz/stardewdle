import { formatName } from "../../utils/formatString";
import { ATTRIBUTE_KEYS, isFullCropMatch, seasonSet } from "../../utils/cropCompare";
import { useTheme } from "../../context/ThemeContext";
import { useThemedAsset } from "../../hooks/useThemedAsset";
import CursorTooltip from "../CursorTooltip";

const ATTRIBUTE_LABELS = ["Growth", "Price", "Regrow", "Type", "Season"];

const BOX_IMAGE_MAP = {
  growth_time: "Small", //106px -- 40
  base_price: "Small", //106px -- 40
  regrows: "Square", //64px -- 24
  type: "Medium", //160px -- 60
  season: "Large", //192px -- 72
};

const W_STRETCH_MAP = {
  growth_time: "81%",
  base_price: "81%",
  regrows: "75%",
  type: "87%",
  season: "90%",
};

const VALIDATION_OVERLAY_STYLES = {
  light: {
    blend: "mix-blend-multiply",
    green: "bg-cyan-500",
    yellow: "bg-amber-300",
    red: "bg-red-700",
    neutral: "bg-white",
  },
  dark: {
    blend: "mix-blend-overlay",
    green: "bg-green-400",
    yellow: "bg-yellow-100",
    red: "bg-red-400",
    neutral: "",
  },
};

const COL_DIST = "60px 106px 106px 60px 160px 192px";

function capitalize(value) {
  if (typeof value === "string") {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  return value;
}

function getColor(key, guessValue, correctValue) {
  if (key === "season") {
    const guessedSet = seasonSet(guessValue);
    const correctSet = seasonSet(correctValue);

    const allMatch =
      guessedSet.size === correctSet.size &&
      [...guessedSet].every((season) => correctSet.has(season));

    if (allMatch) {
      return "green";
    }

    const partialMatch = [...guessedSet].some((season) =>
      correctSet.has(season),
    );

    if (partialMatch) {
      return "yellow";
    }

    return "red";
  }

  return guessValue === correctValue ? "green" : "red";
}

function getArrow(key, guessValue, correctValue) {
  if (key === "base_price" || key === "growth_time") {
    return guessValue > correctValue
      ? "arrow4D"
      : guessValue < correctValue
        ? "arrow4U"
        : null;
  }

  return null;
}

export default function GuessGrid({ guesses, answer, className, isMobilePortrait }) {
  const { theme } = useTheme();
  const validationOverlayStyles = VALIDATION_OVERLAY_STYLES[theme];
  const boxImages = {
    Small: useThemedAsset("/images/game/boxSmall.webp", theme),
    Square: useThemedAsset("/images/game/boxSquare.webp", theme),
    Medium: useThemedAsset("/images/game/boxMedium.webp", theme),
    Large: useThemedAsset("/images/game/boxLarge.webp", theme),
  };

  const rows = Array.from({ length: 6 }).map((_, i) => {
    const guessEntry = guesses[i];
    const crop = guessEntry?.crop;
    const cropColor =
      guessEntry && isFullCropMatch(crop, answer)
        ? "green"
        : guessEntry
          ? "red"
          : "gray";

    const x_pos = parseInt(crop?.crop_index) * 40;

    const spriteStyle = {
      backgroundImage: 'var(--sprite-url)',
      backgroundPosition: `-${x_pos}px 0px`,
      backgroundSize: '2880px 40px',
      width: '40px',
      height: '40px',
      imageRendering: 'pixelated',
    };

    return (
      <div
        key={i}
        className="grid gap-[3px] items-center w-full mb-[3px]"
        style={{ gridTemplateColumns: COL_DIST }}
      >
        {/* Frame image */}
        <div
          className="relative h-[60px] w-[60px] flex items-center justify-center"
          style={{
            backgroundImage: `url('${boxImages.Square}')`,
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Color overlay */}
          <div
            className={`w-[75%] h-[75%] absolute z-0 opacity-90 ${validationOverlayStyles.blend} ${validationOverlayStyles[cropColor] ?? validationOverlayStyles.neutral}`}
          />

          {/* Crop image */}
          {crop?.crop_index > -1 && (
            <CursorTooltip label={formatName(crop.name)}>
              <div className="relative group w-12 h-12 flex items-center justify-center">
                <div
                  style={spriteStyle}
                  className="relative z-10"
                />
              </div>
            </CursorTooltip>
          )}
        </div>

        {/* Attribute boxes */}
        {ATTRIBUTE_KEYS.map((key, j) => {
          const value = crop?.[key];
          const correctValue = answer?.[key];
          const color = guessEntry
            ? getColor(key, value, correctValue)
            : "white";
          const arrow = guessEntry
            ? getArrow(key, value, correctValue)
            : "null";

          return (
            <div
              key={j}
              className="relative h-full flex items-center justify-center text-2xl leading-none"
              style={{
                backgroundImage: `url('${boxImages[BOX_IMAGE_MAP[key] || "Large"]}')`,
                backgroundSize: "100% 100%",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              {/* Color Overlay */}
              <div
                className={`h-[75%] absolute z-0 opacity-90 ${validationOverlayStyles.blend} ${validationOverlayStyles[color] ?? validationOverlayStyles.neutral}`}
                style={{ width: W_STRETCH_MAP[key] }}
              />

              {/* Content */}
              <div
                className={`relative z-10 flex items-center justify-center ${color === "yellow" ? "text-black" : "text-white"
                  }`}
              >
                {guessEntry ? (
                  key === "season" ? (
                    <div className="flex gap-[3px] items-center justify-center">
                      {(String(value) === "all"
                        ? ["spring", "summer", "fall", "winter"]
                        : Array.isArray(value)
                          ? value.map((s) => s.toLowerCase())
                          : []
                      ).map((season) => (
                        <CursorTooltip
                          key={season}
                          label={season.charAt(0).toUpperCase() + season.slice(1)}
                        >
                          <div className="relative group flex items-center justify-center">
                            <img
                              src={`/images/game/${season}.webp`}
                              alt={season}
                              className="h-6 w-9"
                            />
                          </div>
                        </CursorTooltip>
                      ))}
                    </div>
                  ) : typeof value === "boolean" ? (
                    value ? (
                      "Yes"
                    ) : (
                      "No"
                    )
                  ) : key === "base_price" ? (
                    <>
                      {value}g{" "}
                      {arrow ? (
                        <img
                          src={`/images/game/${arrow}.webp`}
                          alt={arrow}
                          className="h-[6px] w-[10px] ml-1"
                        />
                      ) : (
                        ""
                      )}
                    </>
                  ) : key === "growth_time" ? (
                    <>
                      {value} days{" "}
                      {arrow ? (
                        <img
                          src={`/images/game/${arrow}.webp`}
                          alt={arrow}
                          className="h-[6px] w-[10px] ml-1"
                        />
                      ) : (
                        ""
                      )}
                    </>
                  ) : (
                    capitalize(value ?? "")
                  )
                ) : (
                  ""
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  });

  return (
    <div className={`space-y-[2px] h-full w-full flex items-center justify-center pb-2 ${isMobilePortrait ? "ml-2 pl-5" : "pl-9"}`}
      style={{
        width: isMobilePortrait ? "750px" : "772px",
        height: "456px",
      }}>
      <div
        className={`h-full w-full flex flex-col justify-center ${className}`}
      >
        {/* Headers */}
        <div className="grid gap-[3px]" style={{ gridTemplateColumns: COL_DIST }}>
          <div className="text-center text-3xl text-main leading-none">
            Crop
          </div>
          {ATTRIBUTE_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-3xl text-main leading-none"
            >
              {label}
            </div>
          ))}
        </div>
        {/* Rows */}
        {rows}
      </div>
    </div>
  );
}
