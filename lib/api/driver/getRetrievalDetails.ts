import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

export function getRetrievalDetails(
  retrievalId: string,
  callback: (data: any) => void
) {
  const ref = doc(db, "retrieval", retrievalId);

  return onSnapshot(ref, (snapshot) => {
    callback({
      id: snapshot.id,
      ...snapshot.data(),
    });
  });
}
