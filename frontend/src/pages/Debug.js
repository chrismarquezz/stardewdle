import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { scrollbarStyles } from "../utils/scrollbarStyles";
import { useResponsiveLayout } from "../hooks/useResponsiveScale";

import CustomButton from "../components/CustomButton";

const DATA_KEYS = new Set([
  "stardewdle-cooking",
  "stardewdle-crops",
  "stardewdle-fish",
  "stardewdle-minerals",
  "stardewdle-quotes",
]);

function readStorage() {
  try {
    const entries = Object.keys(localStorage)
      .sort()
      .map((key) => [key, localStorage.getItem(key)])
      .filter(([, value]) => value !== null);
    return { entries, error: null };
  } catch {
    return { entries: [], error: "Local storage is unavailable in this browser." };
  }
}

function formatValue(value) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

export default function Debug() {
  const navigate = useNavigate();
  const { width, height, scaleFactor } = useResponsiveLayout();
  const [snapshot, setSnapshot] = useState(readStorage);
  const [selectedKeys, setSelectedKeys] = useState(
    () => new Set(snapshot.entries.filter(([key]) => !DATA_KEYS.has(key)).map(([key]) => key))
  );
  const [status, setStatus] = useState("");
  const [manualCopy, setManualCopy] = useState(null);
  const [copying, setCopying] = useState(false);

  const selectedCount = snapshot.entries.filter(([key]) => selectedKeys.has(key)).length;
  const groups = [
    { label: "All", keys: snapshot.entries.map(([key]) => key) },
    { label: "Regular", keys: snapshot.entries.filter(([key]) => !DATA_KEYS.has(key)).map(([key]) => key) },
    { label: "Data", keys: snapshot.entries.filter(([key]) => DATA_KEYS.has(key)).map(([key]) => key) },
  ];

  const handleSelection = (keys, checked) => {
    setSelectedKeys((previous) => {
      const next = new Set(previous);
      keys.forEach((key) => checked ? next.add(key) : next.delete(key));
      return next;
    });
    setStatus("");
    setManualCopy(null);
  };

  useEffect(() => {
    const refresh = () => setSnapshot(readStorage());
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    refresh();
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const handleRefresh = () => {
    setSnapshot(readStorage());
    setStatus("");
    setManualCopy(null);
  };

  const handleClear = (key) => {
    if (!window.confirm(`Clear "${key}"? This cannot be undone and may reset saved progress or settings.`)) {
      return;
    }
    try {
      localStorage.removeItem(key);
      handleSelection([key], false);
      setSnapshot(readStorage());
      setManualCopy(null);
      setStatus(`Cleared "${key}".`);
    } catch {
      setStatus(`Could not clear "${key}". Your browser may be blocking local storage.`);
    }
  };

  const handleCopy = async () => {
    const current = readStorage();
    setSnapshot(current);
    setManualCopy(null);
    if (current.error) {
      setStatus(current.error);
      return;
    }
    const selectedEntries = current.entries.filter(([key]) => selectedKeys.has(key));
    if (selectedEntries.length === 0) {
      setStatus("Select at least one field to copy.");
      return;
    }
    const report = JSON.stringify(Object.fromEntries(selectedEntries), null, 2);
    setCopying(true);
    try {
      await navigator.clipboard.writeText(report);
      setStatus(`Copied ${selectedEntries.length} local storage fields.`);
    } catch {
      setManualCopy(report);
      setStatus("Clipboard access was blocked. Copy the selected report below manually.");
    } finally {
      setCopying(false);
    }
  };

  const buttonClass = "clickable border-2 border-main bg-white/90 px-4 py-2 text-3xl text-main focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex justify-center items-center">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/background.webp')" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
        }}
      />

      <div
        className="absolute left-1/2 top-1/2 z-10 flex flex-col items-center overflow-y-auto"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(-50%, -50%) scale(${scaleFactor})`,
          transformOrigin: "center center",
        }}
      >
        <CustomButton
          variant="title"
          icon="/images/stardewdleLogo.webp"
          label="Stardewdle Home"
          isMuted={true}
          onClick={() => navigate("/")}
          soundPath={"/sounds/mouseClick.mp3"}
          className="mb-4"
        />

        <div className={`mx-auto min-h-0 w-full flex-1 bg-[#f5deb3] p-8 overflow-y-auto text-main border-4 border-main text-3xl ${scrollbarStyles}`}>
          <div className="pb-4">
            <h1 className="text-5xl">Local Storage Debug</h1>
            <p className="mt-2">Clearing a field cannot be undone.</p>
            <div className="mt-2 flex flex-wrap gap-5">
              <legend className="sr-only">Select fields to copy</legend>
              {groups.map(({ label, keys }) => {
                const count = keys.filter((key) => selectedKeys.has(key)).length;
                return (
                  <label key={label} className="clickable flex items-center gap-2 text-3xl">
                    <input
                      type="checkbox"
                      checked={keys.length > 0 && count === keys.length}
                      ref={(input) => {
                        if (input) input.indeterminate = count > 0 && count < keys.length;
                      }}
                      disabled={keys.length === 0}
                      onChange={(event) => handleSelection(keys, event.target.checked)}
                      className="clickable h-5 w-5 accent-main"
                    />
                    {label}
                  </label>
                );
              })}
            </div>
            <div className="mt-2 text-xl">{selectedCount} of {snapshot.entries.length} fields selected</div>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button type="button" className={buttonClass} onClick={handleCopy} disabled={copying || Boolean(snapshot.error) || selectedCount === 0}>
                {copying ? "Copying..." : "Copy selected fields"}
              </button>
              <button type="button" className={buttonClass} onClick={handleRefresh}>Refresh</button>
            </div>
          </div>

          {status && <p role="status" aria-live="polite" className="pb-4 text-xl break-words">{snapshot.error || status}</p>}

          {manualCopy !== null && (
            <textarea
              aria-label="Local storage report"
              readOnly
              autoFocus
              onFocus={(event) => event.target.select()}
              value={manualCopy}
              className={`mb-6 h-56 w-full border-2 border-main bg-white p-3 font-mono ${scrollbarStyles}`}
            />
          )}

          {!snapshot.error && snapshot.entries.length === 0 && <p className="">No local storage fields are stored.</p>}

          <ul className="min-w-0 border-t-2 border-main">
            {snapshot.entries.map(([key, value]) => (
              <li key={key} className="flex min-w-0 items-start gap-3 border-b-2 border-main/40 py-4">
                <input
                  type="checkbox"
                  aria-label={`Select ${key}`}
                  checked={selectedKeys.has(key)}
                  onChange={(event) => handleSelection([key], event.target.checked)}
                  className="clickable mt-4 h-5 w-5 shrink-0 accent-main"
                />
                <details className="min-w-0 flex-1">
                  <summary className="clickable break-all py-2 font-mono font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main">{key}</summary>
                  <pre className={`mt-3 max-h-[240px] overflow-y-auto whitespace-pre-wrap break-all bg-white/75 p-3 mr-10 font-mono text-lg ${scrollbarStyles}`}>{value === "" ? "(empty string)" : formatValue(value)}</pre>
                </details>
                <button
                  type="button"
                  className={`${buttonClass} shrink-0`}
                  aria-label={`Clear ${key}`}
                  onClick={() => handleClear(key)}
                >Clear</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}