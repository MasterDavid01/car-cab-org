import { lockAsync, OrientationLock } from 'expo-screen-orientation';

export async function lockPortrait() {
  await lockAsync(OrientationLock.PORTRAIT);
}
