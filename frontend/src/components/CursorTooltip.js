import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../context/ThemeContext";
import { useThemedAsset } from "../hooks/useThemedAsset";

export default function CursorTooltip({
  children,
  label,
  backgroundImage = "/images/label.webp",
  textClassName = "text-main",
  fontSizeClassName = "text-xl",
}) {
  const { theme } = useTheme();
  const themedBackground = useThemedAsset(label ? backgroundImage : "", theme);
  const tooltipRef = useRef(null);
  const pointerPositionRef = useRef({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const positionTooltip = (x, y) => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const left = Math.max(8, Math.min(x + 14, window.innerWidth - width - 8));
    const top = Math.max(8, Math.min(y + 14, window.innerHeight - height - 8));

    tooltip.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  };

  const updatePosition = (event) => {
    pointerPositionRef.current = { x: event.clientX, y: event.clientY };
    positionTooltip(event.clientX, event.clientY);
  };

  useLayoutEffect(() => {
    if (label && isVisible) {
      positionTooltip(pointerPositionRef.current.x, pointerPositionRef.current.y);
    }
  }, [isVisible, label]);

  if (!label) return children;

  return (
    <div
      className="contents"
      onPointerEnter={(event) => {
        updatePosition(event);
        setIsVisible(true);
      }}
      onPointerMove={updatePosition}
      onPointerLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          data-cursor-tooltip
          className={`pointer-events-none fixed z-[10000] flex items-center justify-center px-3 py-1 text-center font-medium whitespace-nowrap ${fontSizeClassName} ${textClassName}`}
          style={{
            left: 0,
            top: 0,
            backgroundImage: `url('${themedBackground}')`,
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            height: "28px",
          }}
        >
          {label}
        </div>,
        document.body
      )}
    </div>
  );
}
