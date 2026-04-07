import { db } from "../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

export async function acceptRetrieval(retrievalId: string, driverId: string) {
  const ref = doc(db, "retrievals", retrievalId);

  await updateDoc(ref, {
    status: "accepted",
    driverId,
    acceptedAt: Date.now(),
  });
}
