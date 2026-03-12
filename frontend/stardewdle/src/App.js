import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import { SoundProvider } from "./context/SoundContext";

import './App.css';

import Landing from "./pages/Landing";
import Game from "./pages/Game";
import Collections from "./pages/Collections";
import Count from "./pages/Count";

export default function App() {
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
