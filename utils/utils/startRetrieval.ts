import { db } from "../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

export async function startRetrieval(retrievalId: string) {
  const ref = doc(db, "retrievals", retrievalId);

  await updateDoc(ref, {
    status: "started",
    startedAt: Date.now(),
  });
}
