import { db } from "../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

export async function arrivalAtPickup(retrievalId: string) {
  const ref = doc(db, "retrievals", retrievalId);

  await updateDoc(ref, {
    status: "arrived",
    arrivedAt: Date.now(),
  });
}
