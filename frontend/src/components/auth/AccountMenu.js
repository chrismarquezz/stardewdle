import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useResponsiveLayout } from "../../hooks/useResponsiveScale";
import { useTheme } from "../../context/ThemeContext";
import { useThemedAsset } from "../../hooks/useThemedAsset";
import { scrollbarStyles } from "../../utils/scrollbarStyles";
import CustomButton from "../CustomButton";
import CustomModal from "../CustomModal";

export default function AccountMenu() {
  const {
    user,
    accountId,
    isAdmin,
    loading,
    authError,
    isConfigured,
    signInWithGoogle,
    signInWithEmail,
    createEmailAccount,
    signOutUser,
    adminResetDailyProgress,
    syncStatus,
    syncError,
    retryProgressSync,
  } = useAuth();
  const { isMobilePortrait } = useResponsiveLayout();
  const { theme } = useTheme();
  const leftArrow = useThemedAsset("/images/arrow4L.webp", theme);
  const rightArrow = useThemedAsset("/images/arrow4R.webp", theme);
  const sharePanelTintClassName = theme === "dark" ? "bg-[#A58C66]" : "bg-[#FFD789]";
  const mainBackgroundClassName = theme === "dark" ? "bg-alternative-dark text-[#BC6131]" : "bg-main";
  const mainBorderClassName = theme === "dark" ? "border-alternative-dark" : "border-main";
  const buttonHoverClassName = theme === "dark" ? "hover:bg-[#984318]" : "hover:bg-[#9c4f26]";
  const actionButtonClassName = `clickable w-full ${mainBackgroundClassName} text-white text-2xl md:text-4xl py-2 ${buttonHoverClassName} transition disabled:opacity-50 disabled:cursor-not-allowed`;
  const inputClassName = `${sharePanelTintClassName} bg-opacity-60 border-2 ${mainBorderClassName} px-3 py-2 text-main text-md md:text-xl`;
  const infoBoxClassName = `${sharePanelTintClassName} mx-auto w-full bg-opacity-60 border-2 ${mainBorderClassName} p-3 md:p-4 text-main text-md md:text-xl text-center`;
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isAdminPage, setIsAdminPage] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [resetSupportId, setResetSupportId] = useState("");
  const [resetReason, setResetReason] = useState("");
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [supportCopyMessage, setSupportCopyMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const runAction = async (action) => {
    setError("");
    setIsBusy(true);
    try {
      await action();
      setIsOpen(false);
    } catch (actionError) {
      setError(actionError.message || "Account action failed. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleEmailSubmit = (event) => {
    event.preventDefault();
    const action = isCreatingAccount
      ? () => createEmailAccount(email, password)
      : () => signInWithEmail(email, password);
    runAction(action);
  };

  const copySupportId = async () => {
    if (!accountId) return;
    setError("");
    setSupportCopyMessage("");
    try {
      await navigator.clipboard.writeText(accountId);
      setSupportCopyMessage("Support ID copied.");
    } catch (copyError) {
      setError(copyError.message || "Could not copy the support ID.");
    }
  };

  const handleAdminReset = async (event) => {
    event.preventDefault();
    setError("");
    setResetMessage("");
    setIsBusy(true);
    try {
      const result = await adminResetDailyProgress(resetSupportId.trim(), resetReason.trim());
      setResetMessage(result.reset
        ? `Daily progress reset for ${result.date}.`
        : `No completed daily result needed resetting for ${result.date}.`);
      setResetSupportId("");
      setResetReason("");
      setResetConfirmation("");
    } catch (resetError) {
      setError(resetError.message || "Could not reset daily progress.");
    } finally {
      setIsBusy(false);
    }
  };

  const openAccountMenu = () => {
    setShowEmailForm(false);
    setIsCreatingAccount(false);
    setIsAdminPage(false);
    setError("");
    setIsOpen(true);
  };

  const isShowingAdminPage = Boolean(user && isAdmin && isAdminPage);
  const pageToggle = user && isAdmin && (
    <>
      <button
        type="button"
        onClick={() => setIsAdminPage(false)}
        disabled={!isAdminPage}
        aria-label="Account page"
        className={`absolute top-6 md:top-10 right-12 md:right-24 ${!isAdminPage ? "opacity-50 pointer-events-none" : "hover:brightness-150 clickable"}`}
      >
        <img src={leftArrow} alt="" className="scale-[2] md:scale-[4]" />
      </button>
      <button
        type="button"
        onClick={() => setIsAdminPage(true)}
        disabled={isAdminPage}
        aria-label="Admin reset page"
        className={`absolute top-6 md:top-10 right-6 md:right-14 ${isAdminPage ? "opacity-50 pointer-events-none" : "hover:brightness-150 clickable"}`}
      >
        <img src={rightArrow} alt="" className="scale-[2] md:scale-[4]" />
      </button>
    </>
  );

  return (
    <>
      <CustomButton
        variant="icon"
        icon={`/images/buttons/icons/${user ? "sync-on" : "sync-off"}.webp`}
        label={
          loading
            ? "Loading account..."
            : user
              ? syncStatus === "error"
                ? "Account sync needs attention"
                : "Account sync is on"
              : "Sign in to sync progress"
        }
        isMuted={true}
        onClick={openAccountMenu}
        showLabel={true}
        mobilePortrait={isMobilePortrait}
        className="cursor-pointer"
      />

      {isOpen && (
        <CustomModal
          title={isShowingAdminPage ? "Admin Reset" : "Account"}
          isMuted={true}
          onClose={() => setIsOpen(false)}
          headerContent={pageToggle}
        >
          <div className={`mx-auto flex max-h-[70vh] w-full max-w-xl flex-col gap-4 overflow-y-auto px-4 py-4 text-main ${scrollbarStyles}`}>
            {isShowingAdminPage ? (
              <form className="flex flex-col gap-3 px-12 text-center text-md md:text-xl" onSubmit={handleAdminReset}>
                <label className="flex flex-col gap-1">
                  User support ID
                  <input
                    value={resetSupportId}
                    onChange={(event) => setResetSupportId(event.target.value)}
                    required
                    className={inputClassName}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Reason (recorded in the audit log)
                  <input
                    value={resetReason}
                    onChange={(event) => setResetReason(event.target.value)}
                    required
                    maxLength={500}
                    className={inputClassName}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Type RESET to confirm
                  <input
                    value={resetConfirmation}
                    onChange={(event) => setResetConfirmation(event.target.value)}
                    required
                    className={inputClassName}
                  />
                </label>
                <button
                  type="submit"
                  className="clickable w-full bg-wrong py-2 text-xl text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 md:text-3xl"
                  disabled={
                    isBusy
                    || resetConfirmation !== "RESET"
                    || !resetSupportId.trim()
                    || !resetReason.trim()
                  }
                >
                  {isBusy ? "Resetting..." : "Reset today's game"}
                </button>
                {supportCopyMessage && (
                  <p role="status" className="text-center text-sm md:text-lg">{supportCopyMessage}</p>
                )}
                {error && (
                  <p role="alert" className="text-center text-sm md:text-lg text-wrong">{error}</p>
                )}
              </form>
            ) : !isConfigured ? (
              <p className="text-center text-md md:text-2xl">
                Account services are not configured in this deployment yet. You can continue
                playing as a guest.
              </p>
            ) : user ? (
              <div className="flex flex-col items-center justify-center space-y-2 md:space-y-4 -mt-2 md:mt-0">
                <span className="text-center text-main text-md md:text-3xl">Signed in as</span>
                <div className={`${infoBoxClassName} `}>
                  <span className="break-words">
                    {user.displayName || user.email || "Stardewdle player"}
                  </span>
                </div>
                <span className="text-center text-main text-md md:text-3xl">Support ID</span>

                <div className={`${infoBoxClassName} flex flex-col items-center gap-2`}>
                  {accountId ? (
                    <div className="flex w-full items-center justify-center gap-3">
                      <span className="break-words">
                        {accountId}
                      </span>
                      <CustomButton
                        variant="share"
                        icon={"/images/buttons/copy.webp"}
                        label={"Copy support ID"}
                        isMuted={true}
                        onClick={copySupportId}
                        isMobilePortrait={isMobilePortrait}
                      />
                    </div>

                  ) : (
                    <p className="text-sm md:text-lg">
                      It will be available after account progress has initialized in the game.
                    </p>
                  )}
                </div>
                {resetMessage && (
                  <p role="status" className="text-center text-sm md:text-lg">{resetMessage}</p>
                )}

                <p role="status" className="text-center text-md md:text-xltext-md md:text-xl">
                  {syncStatus === "syncing" && "Syncing progress..."}
                  {syncStatus === "synced" && "Progress is synced."}
                  {syncStatus === "error" && "Progress sync needs attention."}
                  {syncStatus === "idle" && "Progress sync will start when the game is ready."}
                </p>
                {syncError && (
                  <p role="alert" className="break-words text-center text-sm md:text-lg text-wrong">
                    {syncError}
                  </p>
                )}
                {syncStatus === "error" && (
                  <button
                    type="button"
                    className={actionButtonClassName}
                    onClick={retryProgressSync}
                  >
                    Retry sync
                  </button>
                )}
                {error && (
                  <p role="alert" className="text-center text-sm md:text-lg text-wrong">{error}</p>
                )}
                <p className="text-center text-md md:text-xl italic">
                  Progress is only saved upon completion of the crop game or completion of all minigames.
                </p>
                <button
                  type="button"
                  className={actionButtonClassName}
                  disabled={isBusy}
                  onClick={() => runAction(signOutUser)}
                >
                  {isBusy ? "Signing out..." : "Sign out"}
                </button>

              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1 text-center text-md md:text-2xl">
                  <p>
                    Link an account for cross-browser syncing and backup.
                  </p>
                  <p>
                    This is optional and you may continue playing as a guest.
                  </p>
                </div>
                {authError && (
                  <p role="alert" className="text-center text-sm md:text-lg text-wrong">
                    {authError.message || "Authentication could not be restored."}
                  </p>
                )}
                <div className="flex justify-center gap-6">
                  <CustomButton
                    variant="icon"
                    icon="/images/buttons/icons/google.webp"
                    label="Continue with Google"
                    isMuted={true}
                    onClick={() => {
                      if (!isBusy && !loading) runAction(signInWithGoogle);
                    }}
                    showLabel={true}
                    mobilePortrait={isMobilePortrait}
                    className={isBusy || loading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                  />
                  <CustomButton
                    variant="icon"
                    icon="/images/buttons/icons/email.webp"
                    label="Sign in with email"
                    isMuted={true}
                    onClick={() => {
                      setError("");
                      setShowEmailForm(true);
                    }}
                    showLabel={true}
                    mobilePortrait={isMobilePortrait}
                    className="cursor-pointer"
                  />
                </div>
                {showEmailForm && (
                  <>
                    <form className="flex flex-col gap-3" onSubmit={handleEmailSubmit}>
                      <label className="flex flex-col gap-1 text-md md:text-xl">
                        Email
                        <input
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className={inputClassName}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-md md:text-xl">
                        Password
                        <input
                          type="password"
                          autoComplete={isCreatingAccount ? "new-password" : "current-password"}
                          minLength={6}
                          required
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className={inputClassName}
                        />
                      </label>
                      <button
                        type="submit"
                        className={actionButtonClassName}
                        disabled={isBusy || loading}
                      >
                        {isBusy
                          ? "Please wait..."
                          : isCreatingAccount
                            ? "Create account"
                            : "Sign in with email"}
                      </button>
                    </form>
                    <button
                      type="button"
                      className="clickable text-md underline md:text-xl"
                      disabled={isBusy}
                      onClick={() => {
                        setError("");
                        setIsCreatingAccount((current) => !current);
                      }}
                    >
                      {isCreatingAccount
                        ? "Already have an account? Sign in"
                        : "New here? Create an account"}
                    </button>
                  </>
                )}
                {error && (
                  <p role="alert" className="text-center text-sm md:text-lg text-wrong">
                    {error}
                  </p>
                )}
              </>
            )}
          </div>
        </CustomModal>
      )}
    </>
  );
}
