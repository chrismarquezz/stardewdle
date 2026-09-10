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

export default function CropLoader({ className }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % cropImages.length);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center h-full w-full`}>
      <div className={`flex flex-col items-center ${className}`}>
        <img
          src={`/images/loading/${cropImages[index]}`}
          alt="Loading crop"
          className="w-20 h-20 object-contain"
        />
        <p className="mt-4 text-[#2A0A84] text-5xl text-center">
          Loading...
        </p>
      </div>
    </div>
  );
}
