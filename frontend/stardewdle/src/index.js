import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Analytics } from "@vercel/analytics/react";

import { SoundProvider } from "./context/SoundContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <SoundProvider>
    <React.StrictMode>
      <App />
      <Analytics />
    </React.StrictMode>
  </SoundProvider>,
);
