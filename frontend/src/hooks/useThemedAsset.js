import { useEffect, useState } from "react";

export function getThemedAssetPath(path, theme) {
  if (theme !== "dark") return path;

  const extensionIndex = path.lastIndexOf(".");
  if (extensionIndex === -1) return path;

  return `${path.slice(0, extensionIndex)}-dark${path.slice(extensionIndex)}`;
}

export function useThemedAsset(path, theme) {
  const [fallbackPath, setFallbackPath] = useState(null);
  const themedPath = getThemedAssetPath(path, theme);

  useEffect(() => {
    if (theme !== "dark" || themedPath === path) return undefined;

    const image = new Image();
    image.onerror = () => setFallbackPath(themedPath);
    image.src = themedPath;

    return () => {
      image.onerror = null;
    };
  }, [path, theme, themedPath]);

  return theme === "dark" && fallbackPath === themedPath ? path : themedPath;
}
