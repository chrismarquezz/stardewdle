import { useResponsiveViewport } from "../context/ResponsiveContext";

export function useMobilePortrait() {
  const { width, height } = useResponsiveViewport();
  return width < 768 && height > width;
}
