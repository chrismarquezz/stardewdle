const { applicationDefault, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

async function main() {
  const [action, email] = process.argv.slice(2);
  if (!["grant", "revoke"].includes(action) || !email) {
    throw new Error("Usage: npm run admin-claim -- <grant|revoke> <user-email>");
  }
  const projectId = process.env.FIREBASE_PROJECT_ID
    || process.env.GOOGLE_CLOUD_PROJECT
    || process.env.GCLOUD_PROJECT;
  if (!projectId) {
    throw new Error("Set FIREBASE_PROJECT_ID to the intended Firebase project ID.");
  }

  initializeApp({ credential: applicationDefault(), projectId });
  const auth = getAuth();
  const user = await auth.getUserByEmail(email);
  const customClaims = { ...user.customClaims };
  if (action === "grant") customClaims.admin = true;
  else delete customClaims.admin;

  await auth.setCustomUserClaims(user.uid, customClaims);
  console.log(`${action === "grant" ? "Granted" : "Revoked"} admin access for UID ${user.uid}.`);
  console.log("The user must sign out and back in (or refresh the ID token) for this to take effect.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
