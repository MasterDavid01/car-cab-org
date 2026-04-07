type BypassRecord = { enabled: boolean; address?: string; appliedAt: string };

const bypassByUid = new Map<string, BypassRecord>();

export function setAdminBypass(uid: string, address?: string) {
  bypassByUid.set(uid, {
    enabled: true,
    address,
    appliedAt: new Date().toISOString(),
  });
}

export function hasAdminBypass(uid: string) {
  return Boolean(bypassByUid.get(uid)?.enabled);
}

export function clearAdminBypass(uid: string) {
  bypassByUid.delete(uid);
}
