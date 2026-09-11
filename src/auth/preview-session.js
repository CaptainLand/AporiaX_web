export const PREVIEW_LOGIN = "SeaLandTest";
export const PREVIEW_STORAGE_KEY = "aporiax.preview-session.v1";

export function isPreviewLogin(value) {
  return String(value || "").trim().toLowerCase() === PREVIEW_LOGIN.toLowerCase();
}

export function readPreviewSession() {
  try {
    return window.sessionStorage.getItem(PREVIEW_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writePreviewSession(enabled) {
  try {
    if (enabled) window.sessionStorage.setItem(PREVIEW_STORAGE_KEY, "1");
    else window.sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
  } catch {
    // Ignore private-mode storage failures.
  }
}

const nextWeek = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
const lastSeen = new Date(Date.now() - 12 * 60 * 1000).toISOString();

export const PREVIEW_ACCOUNT = {
  user: {
    displayName: "SeaLand Test",
    createdAt: "2026-03-18T08:00:00.000Z",
    phoneVerifiedAt: null,
  },
  identities: [{ type: "email", identifier: PREVIEW_LOGIN }],
};

export const PREVIEW_ACCOUNT_DATA = {
  quota: {
    remainingRatio: 0.72,
    refilled: false,
    cycleEnd: nextWeek,
  },
  invites: {
    inviteCode: "SEALAND1",
    successfulInvites: 1,
    nextRewardPercent: 50,
    rewardsExhausted: false,
    rewards: [
      { ordinal: 1, refillPercent: 100, earned: true },
      { ordinal: 2, refillPercent: 50, earned: false },
      { ordinal: 3, refillPercent: 30, earned: false },
    ],
  },
  devices: [
    {
      id: "preview-desktop",
      name: "SeaLand-PC",
      platform: "win32",
      type: "desktop",
      appVersion: "0.7.5",
      lastSeenAt: lastSeen,
      remoteEnabled: false,
    },
  ],
  sessions: [
    {
      id: "preview-session",
      current: true,
      userAgent: "AporiaX Web Preview",
      lastSeenAt: new Date().toISOString(),
    },
  ],
  usage: {
    requestCount: 18,
    tokens: { input: 126400, output: 24100 },
    byModel: [
      { model: "DeepSeek V4 Flash", requests: 12, inputTokens: 98000, outputTokens: 16200 },
      { model: "DeepSeek V4 Pro", requests: 6, inputTokens: 28400, outputTokens: 7900 },
    ],
  },
  models: [
    { slug: "deepseek-v4-flash", displayName: "DeepSeek V4 Flash", contextWindow: 128000 },
    { slug: "deepseek-v4-pro", displayName: "DeepSeek V4 Pro", contextWindow: 128000 },
  ],
};
