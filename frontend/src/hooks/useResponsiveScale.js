import { useResponsiveViewport } from "../context/ResponsiveContext";
import { useMobilePortrait } from "./useMobilePortrait";

export function useResponsiveScale(designWidth, designHeight) {
  const { width, height } = useResponsiveViewport();
  const scaleW = (width * 0.95) / designWidth;
  const scaleH = (height * 0.95) / designHeight;
  return Math.min(scaleW, scaleH);
}

export function useResponsiveLayout(
  designWidth = 1600,
  designHeight = 900,
) {
  const isMobilePortrait = useMobilePortrait();
  const width = isMobilePortrait ? designHeight : designWidth;
  const height = isMobilePortrait ? designWidth : designHeight;
  const scaleFactor = useResponsiveScale(width, height);

  return { isMobilePortrait, width, height, scaleFactor };
}
