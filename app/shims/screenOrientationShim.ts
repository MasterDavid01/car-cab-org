declare global {
  // eslint-disable-next-line no-var
  var ScreenOrientation: any;
}

if (!global.ScreenOrientation) {
  global.ScreenOrientation = {
    lockAsync: async () => {},
    OrientationLock: {
      PORTRAIT: "PORTRAIT",
      LANDSCAPE: "LANDSCAPE",
    },
  };
}

// This file is inside the Expo Router app directory, so provide a default export
// to avoid route load warnings in development.
export default function ScreenOrientationShimRoute() {
  return null;
}

export {};
