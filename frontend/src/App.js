import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";

import { SoundProvider } from "./context/SoundContext";
import { ThemeProvider } from "./context/ThemeContext";
import { GameDataProvider } from "./context/GameDataContext";
import { ResponsiveProvider } from "./context/ResponsiveContext";
import { AuthProvider } from "./context/AuthContext";

import './App.css';

import Landing from "./pages/Landing";
import Game from "./pages/Game";
import Minigames from "./pages/Minigames";

const Collections = lazy(() => import("./pages/Collections"));
const Count = lazy(() => import("./pages/Count"));
const Debug = lazy(() => import("./pages/Debug"));

export default function App() {
  useEffect(() => {
    const spriteUrl = import.meta.env.VITE_BUCKET_URL + "/sprites/crops.webp?v=20260921";
    if (spriteUrl) {
      document.documentElement.style.setProperty('--sprite-url', `url(${spriteUrl})`);
    }
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <ResponsiveProvider>
          <Router>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/debug" element={<Debug />} />
                <Route element={
                  <SoundProvider>
                    <GameDataProvider>
                      <Outlet />
                    </GameDataProvider>
                  </SoundProvider>
                }>
                  <Route path="/" element={<Landing />} />
                  <Route path="/game" element={<Game />} />
                  <Route path="/collections" element={<Collections />} />
                  <Route path="/count" element={<Count />} />
                  <Route path="/minigames" element={<Minigames />} />
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </ResponsiveProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}