import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import { SoundProvider } from "./context/SoundContext";
import { GameDataProvider } from "./context/GameDataContext";

import './App.css';

import Landing from "./pages/Landing";
import Game from "./pages/Game";
import Collections from "./pages/Collections";
import Count from "./pages/Count";
import Minigames from "./pages/Minigames";

export default function App() {
  useEffect(() => {
    const spriteUrl = import.meta.env.VITE_BUCKET_URL + "/sprites/crops.png";
    if (spriteUrl) {
      document.documentElement.style.setProperty('--sprite-url', `url(${spriteUrl})`);
    }
  }, []);

  return (
    <SoundProvider>
      <GameDataProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/game" element={<Game />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/count" element={<Count />} />
            <Route path="/minigames" element={<Minigames />} />
          </Routes>
        </Router>
      </GameDataProvider>
    </SoundProvider>
  );
}