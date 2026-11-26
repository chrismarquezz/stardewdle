const FIREBASE_ENV_KEYS = {
  apiKey: "VITE_FIREBASE_API_KEY",
  authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
  projectId: "VITE_FIREBASE_PROJECT_ID",
  appId: "VITE_FIREBASE_APP_ID",
};

export function getFirebaseConfig(env) {
  const config = Object.fromEntries(
    Object.entries(FIREBASE_ENV_KEYS).map(([configKey, envKey]) => [
      configKey,
      env[envKey]?.trim() ?? "",
    ])
  );
  const missing = Object.entries(config)
    .filter(([, value]) => value.length === 0)
    .map(([configKey]) => FIREBASE_ENV_KEYS[configKey]);

  return {
    config: missing.length === 0 ? config : null,
    missing,
  };
}
