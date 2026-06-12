import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import { useEffect } from "react";

import { SoundProvider } from "./context/SoundContext";

import './App.css';

import Landing from "./pages/Landing";
import Game from "./pages/Game";
import Collections from "./pages/Collections";
import Count from "./pages/Count";

export default function App() {
  useEffect(() => {
    //const spriteUrl = import.meta.env.VITE_BUCKET_URL + "/sprites/crops.png";
    const spriteUrl = "https://pub-5d3c3bcc4a5f4d4eb8b05f3fa99546f9.r2.dev/sprites/crops.png";

    if (spriteUrl) {
      document.documentElement.style.setProperty('--sprite-url', `url(${spriteUrl})`);
    }
  }, []);

  return (
    <SoundProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/game" element={<Game />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/count" element={<Count />} />
        </Routes>
      </Router>
    </SoundProvider>
  );
}
