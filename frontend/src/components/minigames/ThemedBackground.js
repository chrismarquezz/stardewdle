// Scale dark variants by their canvas-size ratio to preserve the light artwork's pixel scale.
export const MINIGAME_DARK_BACKGROUND_SCALE = {
  selectedFrame: { x: 75 / 60, y: 58 / 41 },
  guesses: { x: 192 / 172, y: 124 / 105 },
  cropGrid: { x: 154 / 134, y: 162 / 143 },
  cropGridMobile: { x: 162 / 143, y: 154 / 134 },
};

export default function ThemedBackground({
  image,
  theme,
  backgroundSize = "100% 100%",
  scale = { x: 1, y: 1 },
  className = "",
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 bg-no-repeat bg-center ${className}`}
      style={{
        backgroundImage: `url('${image}')`,
        backgroundSize,
        transform:
          theme === "dark" ? `scale(${scale.x}, ${scale.y})` : undefined,
        transformOrigin: "center",
      }}
    />
  );
}
