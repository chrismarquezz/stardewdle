const { initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { buildDailyResetUpdate, ProgressResetError } = require("./progressReset");

initializeApp();

const firestore = getFirestore();

exports.adminResetDailyProgress = onCall({ region: "us-east4" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in with an administrator account.");
  }
  if (request.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "Administrator access is required.");
  }

  const supportId = typeof request.data?.supportId === "string"
    ? request.data.supportId.trim()
    : "";
  const reason = typeof request.data?.reason === "string"
    ? request.data.reason.trim()
    : "";
  if (!/^[0-9a-fA-F-]{36}$/.test(supportId)) {
    throw new HttpsError("invalid-argument", "Enter a valid user support ID.");
  }
  if (reason.length < 1 || reason.length > 500) {
    throw new HttpsError("invalid-argument", "A reason of 1-500 characters is required.");
  }

  const today = new Date().toISOString().slice(0, 10);
  const matches = await firestore.collection("users")
    .where("accountId", "==", supportId)
    .limit(2)
    .get();
  if (matches.empty) {
    throw new HttpsError("not-found", "No account matches that support ID.");
  }
  if (matches.size !== 1) {
    throw new HttpsError("failed-precondition", "Support ID is not unique.");
  }

  const profileRef = matches.docs[0].ref;
  const resultRef = profileRef.collection("dailyResults").doc(today);
  const auditRef = firestore.collection("adminAudit").doc();

  try {
    const outcome = await firestore.runTransaction(async (transaction) => {
      const [profileSnapshot, resultSnapshot] = await Promise.all([
        transaction.get(profileRef),
        transaction.get(resultRef),
      ]);
      if (!profileSnapshot.exists) {
        throw new ProgressResetError("Account profile no longer exists.");
      }

      const profile = profileSnapshot.data();
      const dailyResult = resultSnapshot.exists ? resultSnapshot.data() : null;
      const reset = buildDailyResetUpdate(
        profile.stats,
        dailyResult,
        profile.latestDayProgress,
        today
      );
      if (!reset.reset) {
        transaction.set(auditRef, {
          action: "reset-daily-progress",
          actorUid: request.auth.uid,
          actorEmail: request.auth.token.email ?? null,
          targetUid: profileRef.id,
          supportId,
          date: today,
          reason,
          changed: false,
          createdAt: FieldValue.serverTimestamp(),
        });
        return { reset: false };
      }

      transaction.update(profileRef, {
        stats: reset.stats,
        ...(reset.latestDayProgress
          ? { latestDayProgress: reset.latestDayProgress }
          : {}),
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (resultSnapshot.exists) transaction.delete(resultRef);
      transaction.set(auditRef, {
        action: "reset-daily-progress",
        actorUid: request.auth.uid,
        actorEmail: request.auth.token.email ?? null,
        targetUid: profileRef.id,
        supportId,
        date: today,
        reason,
        changed: true,
        createdAt: FieldValue.serverTimestamp(),
      });
      return { reset: true };
    });

    return { ...outcome, supportId, date: today };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    if (error instanceof ProgressResetError) {
      throw new HttpsError("failed-precondition", error.message);
    }
    logger.error("Admin daily progress reset failed.", error);
    throw new HttpsError("internal", "The daily progress reset could not be completed.");
  }
});
