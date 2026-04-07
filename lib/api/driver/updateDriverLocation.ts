import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

export async function updateDriverLocation(
  driverId: string,
  coords: { latitude: number; longitude: number }
) {
  await setDoc(
    doc(db, "drivers", driverId),
    {
      currentLocation: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
      availability: {
        isAvailable: true,
        updatedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  const ref = doc(db, "drivers", driverId, "location", "current");

  await setDoc(ref, {
    latitude: coords.latitude,
    longitude: coords.longitude,
    updatedAt: serverTimestamp(),
  });
}
