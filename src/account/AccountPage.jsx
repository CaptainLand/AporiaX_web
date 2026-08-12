import { useCallback, useEffect, useMemo, useState } from "react";
import { api, getApiUrl } from "../api/client.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import "./quota.css";

const OFFICIAL_ICON_URL = "https://raw.githubusercontent.com/CaptainLand/AporiaX/main/public/aporiax-icon.png";

const copy = {
  en: {
    back: "Back to AporiaX",
    nav: ["Overview", "Quota & Usage", "Devices", "Security", "Preferences"],
    eyebrow: "Aporia Account",
    greeting: "Account control center",
    intro: "Identity, weekly cloud quota and the devices connected to your local AporiaX runtime.",
    weeklyQuota: "Weekly quota",
    quotaLead: "Your free Aporia Cloud allowance refreshes every week.",
    remaining: "remaining",
    reset: "Resets",
    plan: "Plan",
    free: "Free Preview",
    account: "Account",
    verified: "Verified",
    phone: "Phone",
    notVerified: "Not verified",
    memberSince: "Member since",
    usage: "7-day model usage",
    requests: "requests",
    tokens: "tokens",
    devices: "Connected devices",
    noDevices: "No AporiaX desktop device is connected yet.",
    sessions: "Active sessions",
    current: "Current",
    revoke: "Revoke",
    remove: "Remove",
    remote: "Remote",
    on: "On",
    off: "Off",
    profile: "Profile",
    displayName: "Display name",
    save: "Save",
    language: "Language",
    signOut: "Sign out",
    loading: "Loading Aporia Account…",
    signInTitle: "Sign in to open your Account Center",
    signInLead: "Your account connects weekly quota, devices and future remote sessions.",
    signIn: "Sign in",
    retry: "Retry",
    api: "Cloud API",
    models: "Available models",
    invites: "Invites",
    inviteCode: "Your invite code",
    successfulInvites: "Successful invites",
    nextReward: "Next refill",
    rewardsComplete: "All three refill rewards have been used",
    copyInvite: "Copy invite link",
    copied: "Copied",
    inviteRule: "A verified new account refills your current weekly quota: first invite +100%, second +50%, third +30%. The bar never exceeds 100%; any overflow is discarded, and later invites do not refill it.",
    inviteOne: "1st verified invite",
    inviteTwo: "2nd verified invite",
    inviteThree: "3rd verified invite",
    noUsage: "No model usage yet.",
  },
  zh: {
    back: "返回 AporiaX",
    nav: ["总览", "额度与用量", "设备", "安全", "偏好设置"],
    eyebrow: "Aporia Account",
    greeting: "账号控制中心",
    intro: "管理身份、每周云额度，以及连接到本地 AporiaX Runtime 的设备。",
    weeklyQuota: "每周额度",
    quotaLead: "免费的 Aporia Cloud 使用额度每周自动刷新。",
    remaining: "剩余",
    reset: "下次刷新",
    plan: "方案",
    free: "Free Preview",
    account: "账号",
    verified: "已验证",
    phone: "手机号",
    notVerified: "未验证",
    memberSince: "加入时间",
    usage: "近 7 天模型用量",
    requests: "次请求",
    tokens: "tokens",
    devices: "已连接设备",
    noDevices: "目前还没有连接 AporiaX Desktop 设备。",
    sessions: "活跃会话",
    current: "当前",
    revoke: "撤销",
    remove: "移除",
    remote: "远程控制",
    on: "开启",
    off: "关闭",
    profile: "个人资料",
    displayName: "显示名称",
    save: "保存",
    language: "语言",
    signOut: "退出登录",
    loading: "正在加载 Aporia Account…",
    signInTitle: "登录后打开账号控制中心",
    signInLead: "账号会连接每周额度、设备与未来的远程会话。",
    signIn: "登录",
    retry: "重试",
    api: "Cloud API",
    models: "可用模型",
    invites: "邀请",
    inviteCode: "你的邀请码",
    successfulInvites: "有效邀请",
    nextReward: "下一档补充",
    rewardsComplete: "三次额度补充机会均已使用",
    copyInvite: "复制邀请链接",
    copied: "已复制",
    inviteRule: "被邀请的新账号完成邮箱验证后，会补充你当前的每周额度：第一次 +100%，第二次 +50%，第三次 +30%。额度条最高始终为 100%，超出的部分不会保留，之后的邀请也不再补充额度。",
    inviteOne: "第 1 个有效邀请",
    inviteTwo: "第 2 个有效邀请",
    inviteThree: "第 3 个有效邀请",
    noUsage: "还没有模型用量。",
  },
};

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

function formatReset(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRelative(value) {
  if (!value) return "—";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86_400)}d`;
}

function percent(value) {
  return Math.min(100, Math.max(0, Math.round(Number(value || 0) * 100)));
}

export default function AccountPage({ language = "en", setLanguage, onBack, onSignIn }) {
  const text = copy[language] || copy.en;
  const { status, account, logout, reloadMe, updateProfile } = useAuth();
  const [active, setActive] = useState("overview");
  const [data, setData] = useState({ quota: null, invites: null, devices: [], sessions: [], usage: null, models: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const email = account?.identities?.find((identity) => identity.type === "email")?.identifier || "";
  const name = account?.user?.displayName || (email ? email.split("@")[0] : "AporiaX");
  const initials = name.slice(0, 2).toUpperCase();
  const quotaRemaining = percent(data.quota?.remainingRatio);
  const inviteUrl = useMemo(() => {
    if (!data.invites?.inviteCode || typeof window === "undefined") return "";
    const url = new URL("/", window.location.origin);
    url.searchParams.set("invite", data.invites.inviteCode);
    return url.toString();
  }, [data.invites?.inviteCode]);

  useEffect(() => {
    setDisplayName(account?.user?.displayName || "");
  }, [account]);

  const refreshData = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    setError("");
    try {
      const [quota, invites, devices, sessions, usage, models] = await Promise.all([
        api("/quota/weekly"),
        api("/invites"),
        api("/devices"),
        api("/sessions"),
        api("/usage/summary?days=7"),
        api("/models"),
      ]);
      setData({ quota, invites, devices, sessions, usage, models });
    } catch (err) {
      setError(err?.message || "ACCOUNT_LOAD_FAILED");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const totalTokens = useMemo(() => {
    const tokens = data.usage?.tokens;
    return (tokens?.input || 0) + (tokens?.output || 0);
  }, [data.usage]);

  if (status === "booting") {
    return <div className="account-loading"><img src={OFFICIAL_ICON_URL} alt="" /><span>{text.loading}</span></div>;
  }

  if (status !== "authenticated") {
    return (
      <div className="account-gate">
        <button className="account-back-link" type="button" onClick={onBack}>← {text.back}</button>
        <div className="account-gate-card">
          <img src={OFFICIAL_ICON_URL} alt="AporiaX" />
          <p className="account-kicker">Aporia Account</p>
          <h1>{text.signInTitle}</h1>
          <p>{text.signInLead}</p>
          <button className="button button--primary" type="button" onClick={onSignIn}>{text.signIn}</button>
        </div>
      </div>
    );
  }

  async function revokeDevice(id) {
    if (!window.confirm("Remove this device from Aporia Account?")) return;
    await api(`/devices/${id}`, { method: "DELETE" });
    await refreshData();
  }

  async function toggleRemote(device) {
    await api(`/devices/${device.id}`, { method: "PATCH", body: { remoteEnabled: !device.remoteEnabled } });
    await refreshData();
  }

  async function revokeSession(id) {
    await api(`/sessions/${id}`, { method: "DELETE" });
    if (data.sessions.find((session) => session.id === id)?.current) {
      await logout();
      return;
    }
    await refreshData();
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      await updateProfile(displayName.trim());
      await reloadMe();
    } finally {
      setSaving(false);
    }
  }

  async function copyInviteLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function signOut() {
    await logout();
    onBack?.();
  }

  const rewardLabels = [text.inviteOne, text.inviteTwo, text.inviteThree];

  const quotaCard = (
    <article className="account-panel quota-card">
      <div className="quota-card-head">
        <div><span>{text.weeklyQuota}</span><strong>{quotaRemaining}% {text.remaining}</strong></div>
        <span className="quota-state">{data.quota?.refilled ? "refilled" : "weekly"}</span>
      </div>
      <div className="quota-bar-shell"><div className="quota-bar-fill" style={{ width: `${quotaRemaining}%` }} /></div>
      <div className="quota-meta-row"><span>{text.quotaLead}</span><strong>{text.reset}: {formatReset(data.quota?.cycleEnd)}</strong></div>
      <p className="quota-reset-note">{language === "zh" ? "邀请奖励只会补回已经消耗的额度，最高回到 100%，不会扩大额度条上限。" : "Invite rewards only refill consumed quota up to 100%; they never expand the bar beyond its weekly maximum."}</p>
    </article>
  );

  const inviteCard = (
    <article className="account-panel">
      <div className="invite-card-head">
        <div><span>{text.invites}</span><strong>{data.invites?.successfulInvites || 0} {text.successfulInvites}</strong></div>
        <span className="quota-state">{data.invites?.rewardsExhausted ? "complete" : data.invites?.nextRewardPercent ? `+${data.invites.nextRewardPercent}%` : "—"}</span>
      </div>
      <div className="invite-code-box">
        <div className="invite-code-row">
          <code>{data.invites?.inviteCode || "—"}</code>
          <button className="invite-copy" type="button" onClick={copyInviteLink} disabled={!inviteUrl}>{copied ? text.copied : text.copyInvite}</button>
        </div>
        {inviteUrl ? <span className="invite-share-link">{inviteUrl}</span> : null}
      </div>
      <div className="invite-tier-list">
        {(data.invites?.rewards || []).map((reward, index) => (
          <div className={`invite-tier ${reward.earned ? "earned" : ""}`} key={reward.ordinal}>
            <span>{rewardLabels[index] || `Invite ${reward.ordinal}`}</span>
            <strong>+{reward.refillPercent}%</strong>
            <span className="invite-tier-mark">{reward.earned ? "✓" : ""}</span>
          </div>
        ))}
      </div>
      <p className="invite-rule-note">{text.inviteRule}</p>
    </article>
  );

  const panels = {
    overview: (
      <>
        <section className="account-hero-row">
          <div>
            <p className="account-kicker">{text.eyebrow}</p>
            <h1>{text.greeting}</h1>
            <p>{text.intro}</p>
          </div>
          <div className="account-user-chip"><span>{initials}</span><div><strong>{name}</strong><small>{email}</small></div></div>
        </section>

        <section className="account-metric-grid">
          <article className="account-metric account-metric--credit">
            <span>{text.weeklyQuota}</span>
            <strong>{quotaRemaining}%</strong>
            <div className="quota-bar-shell quota-bar-shell--compact"><div className="quota-bar-fill" style={{ width: `${quotaRemaining}%` }} /></div>
            <p>{text.reset}: {formatReset(data.quota?.cycleEnd)}</p>
          </article>
          <article className="account-metric"><span>{text.plan}</span><strong className="account-plan">{text.free}</strong><p>BYOK + Aporia Cloud Preview</p></article>
          <article className="account-metric"><span>{text.usage}</span><strong>{data.usage?.requestCount || 0}</strong><p>{totalTokens.toLocaleString()} {text.tokens}</p></article>
        </section>

        <section className="account-two-col">
          <article className="account-panel">
            <div className="account-panel-title"><div><span>{text.devices}</span><small>{data.devices.length}</small></div><button onClick={() => setActive("devices")}>↗</button></div>
            <div className="account-list">
              {data.devices.length ? data.devices.slice(0, 4).map((device) => (
                <div className="account-row" key={device.id}>
                  <span className="device-status" />
                  <div><strong>{device.name}</strong><small>{device.platform} · AporiaX {device.appVersion || "Preview"}</small></div>
                  <time>{formatRelative(device.lastSeenAt)}</time>
                </div>
              )) : <p className="account-empty">{text.noDevices}</p>}
            </div>
          </article>

          <article className="account-panel">
            <div className="account-panel-title"><div><span>{text.invites}</span><small>{data.invites?.successfulInvites || 0}</small></div><button onClick={() => setActive("quota")}>↗</button></div>
            <div className="invite-code-box">
              <div className="invite-code-row"><code>{data.invites?.inviteCode || "—"}</code><button className="invite-copy" type="button" onClick={copyInviteLink} disabled={!inviteUrl}>{copied ? text.copied : text.copyInvite}</button></div>
              <p className="invite-rule-note">{data.invites?.rewardsExhausted ? text.rewardsComplete : `${text.nextReward}: +${data.invites?.nextRewardPercent || 0}%`}</p>
            </div>
          </article>
        </section>
      </>
    ),

    quota: (
      <>
        <section className="account-section-head"><p className="account-kicker">Aporia Cloud</p><h1>{text.weeklyQuota}</h1><p>{text.quotaLead}</p></section>
        <section className="account-two-col account-two-col--credits">
          {quotaCard}
          {inviteCard}
        </section>
        <section className="account-two-col account-two-col--credits">
          <article className="account-panel">
            <div className="account-panel-title"><div><span>{text.usage}</span><small>7d</small></div></div>
            <div className="quota-usage-list">
              {(data.usage?.byModel || []).map((model) => (
                <div className="quota-usage-row" key={model.model}>
                  <div><strong>{model.model}</strong><small>{model.requests} {text.requests}</small></div>
                  <span>{model.inputTokens || 0} in · {model.outputTokens || 0} out</span>
                </div>
              ))}
              {!data.usage?.byModel?.length ? <p className="account-empty">{text.noUsage}</p> : null}
            </div>
          </article>
          <article className="account-panel">
            <div className="account-panel-title"><div><span>{text.models}</span><small>{data.models.length}</small></div></div>
            <div className="account-list">
              {data.models.map((model) => <div className="account-row" key={model.slug}><span className="device-status" /><div><strong>{model.displayName}</strong><small>{model.contextWindow ? `${model.contextWindow.toLocaleString()} context` : "Aporia Cloud"}</small></div></div>)}
            </div>
          </article>
        </section>
      </>
    ),

    devices: (
      <>
        <section className="account-section-head"><p className="account-kicker">Devices</p><h1>{text.devices}</h1><p>Desktop and companion devices attached to this identity.</p></section>
        <section className="device-grid">
          {data.devices.map((device) => (
            <article className="device-card" key={device.id}>
              <div className="device-card-head"><span className="device-icon">▣</span><span className="device-online">● {formatRelative(device.lastSeenAt)}</span></div>
              <h3>{device.name}</h3><p>{device.platform} · {device.type}</p><small>AporiaX {device.appVersion || "Preview"}</small>
              <div className="device-card-actions"><button type="button" onClick={() => toggleRemote(device)}>{text.remote}: <b>{device.remoteEnabled ? text.on : text.off}</b></button><button className="danger-link" type="button" onClick={() => revokeDevice(device.id)}>{text.remove}</button></div>
            </article>
          ))}
          {!data.devices.length ? <article className="device-card device-card--empty"><span>＋</span><h3>{text.noDevices}</h3><p>Sign in from AporiaX Desktop to bind a local runtime.</p></article> : null}
        </section>
      </>
    ),

    security: (
      <>
        <section className="account-section-head"><p className="account-kicker">Security</p><h1>{text.account}</h1><p>Verified identities and active Aporia sessions.</p></section>
        <section className="account-two-col">
          <article className="account-panel identity-panel">
            <div className="identity-row"><span>Email</span><div><strong>{email}</strong><small className="verified">✓ {text.verified}</small></div></div>
            <div className="identity-row"><span>{text.phone}</span><div><strong>—</strong><small>{account?.user?.phoneVerifiedAt ? `✓ ${text.verified}` : text.notVerified}</small></div></div>
            <div className="identity-row"><span>{text.memberSince}</span><div><strong>{formatDate(account?.user?.createdAt)}</strong></div></div>
          </article>
          <article className="account-panel">
            <div className="account-panel-title"><div><span>{text.sessions}</span><small>{data.sessions.length}</small></div></div>
            <div className="account-list">
              {data.sessions.map((session) => <div className="account-row session-row" key={session.id}><span className="session-icon">◉</span><div><strong>{session.current ? text.current : "Aporia Session"}</strong><small>{session.userAgent || "Unknown client"} · {formatRelative(session.lastSeenAt)}</small></div><button className="danger-link" onClick={() => revokeSession(session.id)}>{text.revoke}</button></div>)}
            </div>
          </article>
        </section>
      </>
    ),

    preferences: (
      <>
        <section className="account-section-head"><p className="account-kicker">Preferences</p><h1>{text.profile}</h1><p>Lightweight settings shared by the Aporia Account.</p></section>
        <section className="account-two-col">
          <article className="account-panel preferences-panel">
            <form onSubmit={saveProfile}>
              <label><span>{text.displayName}</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={name} /></label>
              <label><span>{text.language}</span><div className="language-segment"><button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage?.("en")}>English</button><button type="button" className={language === "zh" ? "active" : ""} onClick={() => setLanguage?.("zh")}>中文</button></div></label>
              <button className="button button--primary" type="submit" disabled={saving || !displayName.trim()}>{saving ? "…" : text.save}</button>
            </form>
          </article>
          <article className="account-panel account-system-panel"><span>{text.api}</span><code>{getApiUrl()}</code><p>Refresh credentials stay in an HttpOnly browser cookie. The page keeps only the short-lived access token in memory.</p><button className="danger-button" type="button" onClick={signOut}>{text.signOut}</button></article>
        </section>
      </>
    ),
  };

  return (
    <div className="account-shell">
      <aside className="account-sidebar">
        <button className="account-brand" type="button" onClick={onBack}><img src={OFFICIAL_ICON_URL} alt="" /><span>AporiaX</span></button>
        <nav>
          {Object.keys(panels).map((key, index) => <button className={active === key ? "active" : ""} key={key} type="button" onClick={() => setActive(key)}><span>{String(index + 1).padStart(2, "0")}</span>{text.nav[index]}</button>)}
        </nav>
        <div className="account-sidebar-bottom"><button type="button" onClick={onBack}>← {text.back}</button><div className="account-sidebar-user"><span>{initials}</span><div><strong>{name}</strong><small>{email}</small></div></div></div>
      </aside>
      <main className="account-main">
        <header className="account-topbar"><div><span className="cloud-dot" />Aporia Cloud</div><div><span className="account-topbar-quota" style={{ "--quota-remaining": `${quotaRemaining}%` }}>{quotaRemaining}%</span><button type="button" onClick={() => setLanguage?.(language === "en" ? "zh" : "en")}>{language === "en" ? "中文" : "EN"}</button></div></header>
        <div className="account-content">
          {error ? <div className="account-error"><span>{error}</span><button type="button" onClick={refreshData}>{text.retry}</button></div> : null}
          {loading && !data.quota ? <div className="account-loading-inline">{text.loading}</div> : panels[active]}
        </div>
      </main>
    </div>
  );
}
