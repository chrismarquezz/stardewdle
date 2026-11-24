export default function BundleIcon({ icon, theme }) {
  return (
    <div
      style={{
        backgroundImage: `url('${icon}')`,
        imageRendering: "pixelated",
        filter: theme === "dark" ? "brightness(90%)" : undefined,
      }}
      className={`absolute bg-cover h-[192px] md:h-[128px] aspect-square bg-no-repeat ${
        theme === "light"
          ? "top-6 md:top-4 left-[84px] md:left-14"
          : "top-[21px] md:top-3.5 left-[87px] md:left-[57px]"
      }`}
    />
  );
}
