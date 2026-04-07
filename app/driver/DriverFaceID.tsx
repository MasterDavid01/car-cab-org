import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { Camera } from "expo-camera";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const { width, height } = Dimensions.get("window");

export default function DriverFaceID({ navigation }) {
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [flashAnim] = useState(new Animated.Value(0));
  const [dotPulse] = useState(new Animated.Value(1));
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    (async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, { toValue: 0.6, duration: 900, useNativeDriver: true }),
        Animated.timing(dotPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const triggerFlash = () => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  const onFacesDetected = async ({ faces }) => {
    if (captured || faces.length === 0) return;

    const face = faces[0];
    const { bounds, rollAngle, yawAngle, leftEyePosition, rightEyePosition } = face;

    const ovalTop = height * 0.08;
    const ovalBottom = height * 0.92;
    const ovalLeft = width * 0.1;
    const ovalRight = width * 0.9;

    const faceInsideOval =
      bounds.origin.y > ovalTop &&
      bounds.origin.y + bounds.size.height < ovalBottom &&
      bounds.origin.x > ovalLeft &&
      bounds.origin.x + bounds.size.width < ovalRight;

    const eyesAligned =
      leftEyePosition &&
      rightEyePosition &&
      Math.abs(leftEyePosition.y - rightEyePosition.y) < 25;

    const rollAligned = Math.abs(rollAngle) < 8;
    const yawAligned = Math.abs(yawAngle) < 10;

    if (faceInsideOval && eyesAligned && rollAligned && yawAligned) {
      setCaptured(true);
      triggerFlash();

      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
        await uploadVerificationPhoto(photo.uri);
        navigation.replace("DriverConsole");
      } catch (err) {
        console.log("Capture error:", err);
        setCaptured(false);
      }
    }
  };

  const uploadVerificationPhoto = async (uri) => {
    const auth = getAuth();
    const uid = auth.currentUser.uid;

    const storage = getStorage();
    const firestore = getFirestore();

    const response = await fetch(uri);
    const blob = await response.blob();

    const filename = erification//.jpg;
    const storageRef = ref(storage, filename);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    await setDoc(doc(firestore, "driverVerification", uid), {
      uid,
      timestamp: Date.now(),
      photoURL: downloadURL,
      status: "verified",
    });
  };

  if (!hasPermission) return <View style={{ flex: 1, backgroundColor: "black" }} />;

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        type={Camera.Constants.Type.front}
        onFacesDetected={onFacesDetected}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.accurate,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
          runClassifications: FaceDetector.FaceDetectorClassifications.none,
        }}
      />

      <View style={styles.mask} />

      <View style={styles.ovalContainer}>
        <View style={styles.oval} />

        <Animated.View
          style={[
            styles.dot,
            { left: width * 0.35, transform: [{ scale: dotPulse }] },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            { left: width * 0.55, transform: [{ scale: dotPulse }] },
          ]}
        />
      </View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.flashOverlay,
          { opacity: flashAnim },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },

  mask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,10,10,0.7)",
  },

  ovalContainer: {
    position: "absolute",
    top: height * 0.08,
    left: width * 0.1,
    width: width * 0.8,
    height: height * 0.84,
    justifyContent: "center",
    alignItems: "center",
  },

  oval: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: width * 0.4,
    borderWidth: 4,
    borderColor: "#F2C94C",
  },

  dot: {
    position: "absolute",
    top: height * 0.32,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F2C94C",
  },

  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(242,201,76,0.85)",
  },
});
