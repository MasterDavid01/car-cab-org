import { db } from "../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

export async function completeRetrieval(retrievalId: string) {
  const ref = doc(db, "retrievals", retrievalId);

  await updateDoc(ref, {
    status: "completed",
    completedAt: Date.now(),
  });
}
