import { useEffect, useState } from "react";

export function getThemedAssetPath(path, theme) {
  if (theme !== "dark") return path;

  const extensionIndex = path.lastIndexOf(".");
  if (extensionIndex === -1) return path;

  return `${path.slice(0, extensionIndex)}-dark${path.slice(extensionIndex)}`;
}

export function useThemedAsset(path, theme) {
  const [resolvedPath, setResolvedPath] = useState(path);

  useEffect(() => {
    if (theme !== "dark") {
      setResolvedPath(path);
      return undefined;
    }

    const themedPath = getThemedAssetPath(path, theme);
    if (themedPath === path) {
      setResolvedPath(path);
      return undefined;
    }

    const image = new Image();
    image.onload = () => setResolvedPath(themedPath);
    image.onerror = () => setResolvedPath(path);
    image.src = themedPath;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [path, theme]);

  return resolvedPath;
}
