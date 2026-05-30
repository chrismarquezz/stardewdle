import { useState, useEffect } from 'react';

export function useResponsiveScale(designWidth, designHeight) {
  const [scaleFactor, setScaleFactor] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const maxWidth = window.innerWidth * 0.95;
      const maxHeight = window.innerHeight * 0.95;
      const scaleW = maxWidth / designWidth;
      const scaleH = maxHeight / designHeight;
      setScaleFactor(Math.min(scaleW, scaleH));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [designWidth, designHeight]);

  return scaleFactor;
}
