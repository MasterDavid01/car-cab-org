import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from '../firebaseConfig';

export default function ProfileSetup() {
  const router = useRouter();
  const storage = getStorage();

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [insuranceCard, setInsuranceCard] = useState<string | null>(null);
  const [licenseFront, setLicenseFront] = useState<string | null>(null);
  const [licenseBack, setLicenseBack] = useState<string | null>(null);
  const [registrationPhoto, setRegistrationPhoto] = useState<string | null>(
    null,
  );

  const pickImage = async (setter: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setter(result.assets[0].uri);
    }
  };

  const uploadToStorage = async (
    uri: string,
    path: string,
  ): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);

    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async () => {
    if (
      !profilePhoto ||
      !insuranceCard ||
      !licenseFront ||
      !licenseBack ||
      !registrationPhoto
    ) {
      Alert.alert("Missing Photos", "Please upload all required images.");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      const userId = user.uid;

      const profilePhotoUrl = await uploadToStorage(
        profilePhoto,
        `users/${userId}/profilePhoto.jpg`,
      );

      const insuranceCardUrl = await uploadToStorage(
        insuranceCard,
        `users/${userId}/insuranceCard.jpg`,
      );

      const licenseFrontUrl = await uploadToStorage(
        licenseFront,
        `users/${userId}/licenseFront.jpg`,
      );

      const licenseBackUrl = await uploadToStorage(
        licenseBack,
        `users/${userId}/licenseBack.jpg`,
      );

      const registrationPhotoUrl = await uploadToStorage(
        registrationPhoto,
        `users/${userId}/registrationPhoto.jpg`,
      );

      const userRef = doc(db, "users", userId);

      await updateDoc(userRef, {
        profilePhoto: profilePhotoUrl,
        insuranceCard: insuranceCardUrl,
        licenseFront: licenseFrontUrl,
        licenseBack: licenseBackUrl,
        registrationPhoto: registrationPhotoUrl,
        profileSetupComplete: true,
      });

      Alert.alert("Success", "Profile setup complete!");
      router.replace("/" as any);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not save your profile.");
    }
  };

  const renderUpload = (
    label: string,
    image: string | null,
    setter: (uri: string) => void,
  ) => (
    <View style={styles.uploadBlock}>
      <Text style={styles.label}>{label}</Text>

      {image ? (
        <Image source={{ uri: image }} style={styles.preview} />
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => pickImage(setter)}
        >
          <Text style={styles.uploadText}>Upload Photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile Setup</Text>

      {renderUpload("Profile Photo", profilePhoto, setProfilePhoto)}
      {renderUpload("Vehicle Insurance Card", insuranceCard, setInsuranceCard)}
      {renderUpload("Driver's License (Front)", licenseFront, setLicenseFront)}
      {renderUpload("Driver's License (Back)", licenseBack, setLicenseBack)}
      {renderUpload(
        "Vehicle Registration",
        registrationPhoto,
        setRegistrationPhoto,
      )}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Finish Setup</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace("/" as any)}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#000",
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  uploadBlock: {
    marginBottom: 25,
  },
  uploadButton: {
    backgroundColor: "#222",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  uploadText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
  },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: "#D4AF37",
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  submitText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  backButton: {
    marginTop: 20,
  },
  backButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
  },
});






