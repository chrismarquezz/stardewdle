import { formatName } from "../../utils/formatString";

export default function CollectionsCard({
  crop,
  isSelected,
  onClick,
  isMuted,
}) {
  const formattedName = formatName(crop.name);

  return (
    <div
      onClick={() => {
        if (!isMuted) {
          new Audio("/sounds/select.mp3").play();
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
        className={`absolute w-[60px] h-[60px] top-0 right-0 opacity-50 mix-blend-multiply ${isSelected ? "bg-green-400" : ""}`}
      />

      {/* Crop Image */}
      <img
        src={crop.image_url}
        alt={crop.name}
        className={`object-contain w-full h-full p-[2px] pl-[6px] pb-[6px] z-10`}
      />

      {/* Custom Label Tooltip */}
      <div
        className="absolute -top-5 left-1/2 -translate-x-1/2 px-3 py-1 flex items-center justify-center text-xl font-medium text-[#D5C9AC] text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap"
        style={{
          backgroundImage: "url('/images/collections/collectionsLabel.webp')",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          height: "28px",
        }}
      >
        {formattedName}
      </div>
    </div>
  );
}
