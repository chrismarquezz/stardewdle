import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

window.addEventListener("vite:preloadError", (event) => {
  const lastReload = Number(sessionStorage.getItem("stardewdle-chunkReload"));
  if (Date.now() - lastReload < 10000) return;
  event.preventDefault();
  sessionStorage.setItem("stardewdle-chunkReload", String(Date.now()));
  window.location.reload();
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
