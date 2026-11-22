import { formatName } from "../../utils/formatString";
import { playSound } from "../../utils/playSound";
import CursorTooltip from "../CursorTooltip";

export default function CollectionsCard({
  crop,
  isSelected,
  onClick,
  isMuted,
}) {
  const formattedName = formatName(crop.name);

  const x_pos = parseInt(crop.crop_index) * 48;

  const spriteStyle = {
    backgroundImage: 'var(--sprite-url)',
    backgroundPosition: `-${x_pos}px 0px`,
    backgroundSize: '3456px 48px',
    width: '48px',
    height: '48px',
    imageRendering: 'pixelated',
  };

  return (
    <CursorTooltip
      label={formattedName}
      backgroundImage="/images/collections/collectionsLabel.webp"
      textClassName="text-[#D5C9AC]"
    >
      <div
        onClick={() => {
          if (!isMuted) {
            playSound("/sounds/select.mp3");
          }

          onClick(crop);
        }}
        className={`relative w-16 h-16 clickable p-1 flex items-center justify-center group`}
        style={{
          backgroundImage: "url('/images/collections/collectionsItemBoxAlt.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className={`absolute w-[60px] h-[60px] top-0 right-0 opacity-60 mix-blend-screen ${isSelected ? "bg-yellow-100" : ""}`}
        />

        <div
          style={spriteStyle}
          className="w-full h-full m-[2px] ml-[6px] mb-[6px] z-10"
        />

      </div>
    </CursorTooltip>
  );
}
