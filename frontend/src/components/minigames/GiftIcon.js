import { useState, useEffect } from "react";

export default function GiftIcon() {
  const [index, setIndex] = useState(0);
  const scale = 4;

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % 4);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`w-[72px] h-[76px]`}
      style={{
        backgroundImage: "url(/images/minigames/gifts.webp)",
        backgroundPosition: `${index * 72}px`,
        backgroundSize: `288px 76px`,
        imageRendering: 'pixelated',
      }}
    />
  );
}
