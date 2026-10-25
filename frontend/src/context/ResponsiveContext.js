import { createContext, useContext, useEffect, useState } from "react";

const ResponsiveContext = createContext(null);

function getViewport() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function ResponsiveProvider({ children }) {
  const [viewport, setViewport] = useState(getViewport);

  useEffect(() => {
    const handleResize = () => setViewport(getViewport());

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <ResponsiveContext.Provider value={viewport}>
      {children}
    </ResponsiveContext.Provider>
  );
}

export function useResponsiveViewport() {
  const viewport = useContext(ResponsiveContext);
  if (!viewport) {
    throw new Error("useResponsiveViewport must be used within a ResponsiveProvider");
  }

  return viewport;
}
