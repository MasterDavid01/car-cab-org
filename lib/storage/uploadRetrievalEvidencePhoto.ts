import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../../firebaseConfig";

type UploadEvidenceOptions = {
  retrievalId: string;
  category: string;
  localUri: string;
  extension?: string;
};

export async function uploadRetrievalEvidencePhoto({
  retrievalId,
  category,
  localUri,
  extension = "jpg",
}: UploadEvidenceOptions) {
  const sanitizedCategory = category.replace(/[^a-zA-Z0-9/_-]/g, "_");
  const storagePath = `retrievalEvidence/${retrievalId}/${sanitizedCategory}.${extension}`;
  const fileRef = ref(storage, storagePath);
  const response = await fetch(localUri);
  const blob = await response.blob();

  await uploadBytes(fileRef, blob);
  const downloadURL = await getDownloadURL(fileRef);

  return {
    storagePath,
    downloadURL,
  };
}