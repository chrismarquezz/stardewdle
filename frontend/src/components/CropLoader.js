import { useState, useEffect } from "react";

const cropImages = [
  "row-1-column-1.webp",
  "row-1-column-2.webp",
  "row-1-column-3.webp",
  "row-1-column-4.webp",
  "row-1-column-5.webp",
  "row-1-column-6.webp",
  "row-1-column-7.webp",
  "row-1-column-8.webp",
];

export default function CropLoader({ className, error, onRetry }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (error) return;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % cropImages.length);
    }, 100);
    return () => clearInterval(interval);
  }, [error]);

  return (
    <div className={`flex items-center justify-center h-full w-full`}>
      <div className={`flex flex-col items-center ${className}`}>
        <img
          src={`/images/loading/${cropImages[index]}`}
          alt="Loading crop"
          className="w-20 h-20 object-contain"
        />
        <p className="mt-4 text-[#2A0A84] text-5xl text-center">
          {error ? "Couldn't load today's game." : "Loading..."}
        </p>
        {error && (
          <>
            <p className="mt-2 text-[#2A0A84] text-2xl text-center max-w-[600px]">
              Retrying automatically when you're back online.
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="clickable mt-4 px-6 py-3 text-3xl bg-[#8b5a2b] text-white rounded-lg transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                Try again
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
