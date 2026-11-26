import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getFirebaseConfig } from "../services/firebaseConfig";

const AuthContext = createContext(null);
const { config: firebaseConfig } = getFirebaseConfig(import.meta.env);
const isFirebaseConfigured = firebaseConfig !== null;

function restoreLocalProgress(uid) {
  const statsBackupKey = `stardewdle-local-stats-${uid}`;
  const savedStats = localStorage.getItem(statsBackupKey);
  if (savedStats) {
    localStorage.setItem("stardewdle-stats", savedStats);
  }

  const today = new Date().toISOString().slice(0, 10);
  const dayBackupKey = `stardewdle-local-day-${uid}-${today}`;
  const savedDay = localStorage.getItem(dayBackupKey);
  if (savedDay) {
    let dayState;
    try {
      dayState = JSON.parse(savedDay);
    } catch (error) {
      throw new Error(`Saved local game state is invalid JSON: ${error.message}`);
    }
    for (const [key, value] of Object.entries(dayState)) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }
  } else {
    localStorage.removeItem("stardewdle-guesses");
    localStorage.removeItem("stardewdle-gameOver");
    localStorage.removeItem("stardewdle-selectedCrop");
    localStorage.removeItem("stardewdle-statsBackup");
  }

  const minigameBackupKey = `stardewdle-local-minigames-${uid}-${today}`;
  const savedMinigames = localStorage.getItem(minigameBackupKey);
  if (savedMinigames) {
    localStorage.setItem("stardewdle-game-data", savedMinigames);
  } else {
    localStorage.removeItem("stardewdle-game-data");
  }

  const minigameOwnerRaw = localStorage.getItem("stardewdle-cloudMinigameOwner");
  if (minigameOwnerRaw) {
    const owner = JSON.parse(minigameOwnerRaw);
    if (owner.uid === uid) localStorage.removeItem("stardewdle-cloudMinigameOwner");
  }

  const ownerRaw = localStorage.getItem("stardewdle-cloudStatsOwner");
  if (ownerRaw) {
    const owner = JSON.parse(ownerRaw);
    if (owner.uid === uid) localStorage.removeItem("stardewdle-cloudStatsOwner");
  }
  const completionOwnerRaw = localStorage.getItem("stardewdle-cloudCompletionOwner");
  if (completionOwnerRaw) {
    const owner = JSON.parse(completionOwnerRaw);
    if (owner.uid === uid) localStorage.removeItem("stardewdle-cloudCompletionOwner");
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [syncError, setSyncError] = useState(null);
  const [syncRetryToken, setSyncRetryToken] = useState(0);
  const previousUser = useRef(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    let unsubscribe;

    import("../services/firebase")
      .then(({ subscribeToAuthChanges }) => {
        if (!active) return;
        unsubscribe = subscribeToAuthChanges(
          async (nextUser) => {
            if (
              previousUser.current
              && previousUser.current.uid !== nextUser?.uid
            ) {
              setAccountId(null);
              try {
                restoreLocalProgress(previousUser.current.uid);
              } catch (restoreError) {
                setError(restoreError);
              }
            }
            setUser(nextUser);
            previousUser.current = nextUser;
            setIsAdmin(false);
            if (!nextUser) {
              setAccountId(null);
            } else {
              const uid = nextUser.uid;
              try {
                const token = await nextUser.getIdTokenResult();
                if (active && previousUser.current?.uid === uid) {
                  setIsAdmin(token.claims.admin === true);
                }
              } catch (tokenError) {
                if (active) setError(tokenError);
              }
            }
            setLoading(false);
            if (!nextUser) {
              setSyncStatus("idle");
              setSyncError(null);
            }
          },
          (authError) => {
            setError(authError);
            setLoading(false);
          }
        );
      })
      .catch((authError) => {
        if (!active) return;
        setError(authError);
        setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const setProgressSyncStatus = useCallback((status, message = null) => {
    setSyncStatus(status);
    setSyncError(message);
  }, []);
  const retryProgressSync = useCallback(() => {
    setSyncRetryToken((current) => current + 1);
  }, []);
  const runAuthAction = useCallback(async (action) => {
    if (!isFirebaseConfigured) {
      throw new Error("Account sign-in is not configured for this deployment.");
    }

    setError(null);
    try {
      const firebaseServices = await import("../services/firebase");
      return await action(firebaseServices);
    } catch (authError) {
      setError(authError);
      throw authError;
    }
  }, []);

  const signInWithGoogle = useCallback(
    () => runAuthAction((firebaseServices) => firebaseServices.signInWithGoogle()),
    [runAuthAction]
  );
  const signInWithEmail = useCallback(
    (email, password) => runAuthAction((firebaseServices) =>
      firebaseServices.signInWithEmail(email, password)
    ),
    [runAuthAction]
  );
  const createEmailAccount = useCallback(
    (email, password) => runAuthAction((firebaseServices) =>
      firebaseServices.createEmailAccount(email, password)
    ),
    [runAuthAction]
  );
  const signOutUser = useCallback(
    () => runAuthAction((firebaseServices) => firebaseServices.signOutUser()),
    [runAuthAction]
  );
  const adminResetDailyProgress = useCallback(
    (supportId, reason) => runAuthAction((firebaseServices) =>
      firebaseServices.adminResetDailyProgress(supportId, reason)
    ),
    [runAuthAction]
  );

  const value = useMemo(() => ({
    user,
    accountId,
    setAccountId,
    isAdmin,
    loading,
    error,
    authError: error,
    isConfigured: isFirebaseConfigured,
    syncStatus,
    syncError,
    syncRetryToken,
    setProgressSyncStatus,
    retryProgressSync,
    signInWithGoogle,
    signInWithEmail,
    createEmailAccount,
    signOutUser,
    adminResetDailyProgress,
  }), [
    user,
    accountId,
    isAdmin,
    loading,
    error,
    syncStatus,
    syncError,
    syncRetryToken,
    signInWithGoogle,
    signInWithEmail,
    createEmailAccount,
    signOutUser,
    adminResetDailyProgress,
    setProgressSyncStatus,
    retryProgressSync,
    setAccountId,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
