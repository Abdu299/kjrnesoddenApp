export type AppPlatform = "ios" | "android";
export type PlatformUpdatePolicy = { enabled: boolean; minimumVersion: string; storeUrl: string };
export type AppUpdatePolicy = {
  schemaVersion: 1; revision: number; ios: PlatformUpdatePolicy; android: PlatformUpdatePolicy;
};

export const defaultAppUpdatePolicy: AppUpdatePolicy = {
  schemaVersion: 1, revision: 0,
  ios: { enabled: false, minimumVersion: "", storeUrl: "" },
  android: { enabled: false, minimumVersion: "", storeUrl: "" },
};

export function validAppVersion(value: unknown): value is string {
  return typeof value === "string" && /^(0|[1-9]\d{0,4})\.(0|[1-9]\d{0,4})\.(0|[1-9]\d{0,4})$/.test(value);
}

export function compareAppVersions(left: string, right: string): number | null {
  if (!validAppVersion(left) || !validAppVersion(right)) return null;
  const a = left.split(".").map(Number), b = right.split(".").map(Number);
  for (let index = 0; index < 3; index++) {
    if (a[index] !== b[index]) return a[index] < b[index] ? -1 : 1;
  }
  return 0;
}

export function validAppStoreUrl(value: string, platform: AppPlatform): boolean {
  return platform === "ios"
    ? /^https:\/\/apps\.apple\.com\/(?:[a-z]{2}\/)?app\/(?:[a-zA-Z0-9_%.-]+\/)?id[0-9]+$/.test(value)
    : /^https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.kjornesodden\.app$/.test(value);
}

export function parseAppUpdatePolicy(value: unknown): AppUpdatePolicy {
  const data = value as AppUpdatePolicy | null;
  if (!data || data.schemaVersion !== 1 || !Number.isInteger(data.revision) || data.revision < 0) {
    throw new Error("Ugyldig oppsett for appoppdateringer.");
  }
  const parse = (platform: AppPlatform): PlatformUpdatePolicy => {
    const rule = data[platform];
    if (!rule || typeof rule.enabled !== "boolean" || typeof rule.minimumVersion !== "string" || typeof rule.storeUrl !== "string" ||
        (rule.minimumVersion !== "" && !validAppVersion(rule.minimumVersion)) ||
        (rule.storeUrl !== "" && !validAppStoreUrl(rule.storeUrl, platform)) ||
        (rule.enabled && (!validAppVersion(rule.minimumVersion) || !validAppStoreUrl(rule.storeUrl, platform)))) {
      throw new Error(`Kontroller versjon og butikklenke for ${platform === "ios" ? "iPhone" : "Android"}. Bruk versjon som 1.0.2 og en direkte lenke til appen.`);
    }
    return { enabled: rule.enabled, minimumVersion: rule.minimumVersion, storeUrl: rule.storeUrl };
  };
  return { schemaVersion: 1, revision: data.revision, ios: parse("ios"), android: parse("android") };
}

export function requiredAppUpdate(policy: AppUpdatePolicy, platform: AppPlatform, installedVersion: string): PlatformUpdatePolicy | null {
  const rule = policy[platform];
  return rule.enabled && compareAppVersions(installedVersion, rule.minimumVersion) === -1 && validAppStoreUrl(rule.storeUrl, platform)
    ? rule : null;
}
