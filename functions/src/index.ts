import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// H) Onboarding endpoint – create driver profile
export const createDriverProfile = functions.https.onCall(async (data, context) => {
  const { uid, vehicleMake, vehicleModel, vehicleColor, licensePlate } = data;

  if (!uid) {
    throw new functions.https.HttpsError("invalid-argument", "Missing uid.");
  }

  const driverRef = db.collection("drivers").doc(uid);
  await driverRef.set(
    {
      vehicleMake: vehicleMake || null,
      vehicleModel: vehicleModel || null,
      vehicleColor: vehicleColor || null,
      licensePlate: licensePlate || null,
      status: "pending-approval",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { success: true };
});

// I) Membership endpoint – set membership status
export const setMembershipStatus = functions.https.onCall(async (data, context) => {
  const { uid, status } = data;

  if (!uid || !status) {
    throw new functions.https.HttpsError("invalid-argument", "Missing uid or status.");
  }

  const userRef = db.collection("customers").doc(uid);
  await userRef.set(
    {
      membershipStatus: status,
      membershipUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { success: true };
});

// J) Retrieval dispatch endpoint – create retrieval request
export const createRetrievalRequest = functions.https.onCall(async (data, context) => {
  const { uid, vehicleLocation, vehicleDescription, notes } = data;

  if (!uid || !vehicleLocation) {
    throw new functions.https.HttpsError("invalid-argument", "Missing uid or vehicleLocation.");
  }

  const requestRef = db.collection("retrievalRequests").doc();
  await requestRef.set({
    customerId: uid,
    vehicleLocation,
    vehicleDescription: vehicleDescription || null,
    notes: notes || null,
    status: "pending-driver",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, requestId: requestRef.id };
});
