import { useCallback, useEffect, useMemo, useState } from "react";
import { api, getApiUrl } from "../api/client.js";
import { useAuth } from "../auth/AuthProvider.jsx";

const OFFICIAL_ICON_URL = "https://raw.githubusercontent.com/CaptainLand/AporiaX/main/public/aporiax-icon.png";

const copy = {
  en: {
    back: "Back to AporiaX",
    nav: ["Overview", "Credits & Usage", "Devices", "Security", "Preferences"],
    eyebrow: "Aporia Account",
    greeting: "Account control center",
    intro: "Identity, model credits and the devices connected to your local AporiaX runtime.",
    credits: "Aporia Credits",
    available: "Available",
    reserved: "Reserved",
    plan: "Plan",
    free: "Free Preview",
    account: "Account",
    verified: "Verified",
    phone: "Phone",
    notVerified: "Not verified",
    memberSince: "Member since",
    recent: "Recent credit activity",
    noActivity: "No credit activity yet.",
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
    devGrant: "Grant 100 test Credits",
    devOnly: "Development only",
    loading: "Loading Aporia Account…",
    signInTitle: "Sign in to open your Account Center",
    signInLead: "Your account connects Credits, devices and future remote sessions.",
    signIn: "Sign in",
    retry: "Retry",
    api: "Cloud API",
    models: "Available models",
  },
  zh: {
    back: "返回 AporiaX",
    nav: ["总览", "Credits 与用量", "设备", "安全", "偏好设置"],
    eyebrow: "Aporia Account",
    greeting: "账号控制中心",
    intro: "管理身份、模型 Credits，以及连接到本地 AporiaX Runtime 的设备。",
    credits: "Aporia Credits",
    available: "可用",
    reserved: "预留中",
    plan: "方案",
    free: "Free Preview",
    account: "账号",
    verified: "已验证",
    phone: "手机号",
    notVerified: "未验证",
    memberSince: "加入时间",
    recent: "最近 Credits 记录",
    noActivity: "还没有 Credits 记录。",
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
    devGrant: "领取 100 测试 Credits",
    devOnly: "仅本地开发",
    loading: "正在加载 Aporia Account…",
    signInTitle: "登录后打开账号控制中心",
    signInLead: "账号会连接 Credits、设备与未来的远程会话。",
    signIn: "登录",
    retry: "重试",
    api: "Cloud API",
    models: "可用模型",
  },
};

function formatCredits(value) {
  const number = Number(value || 0);
  return number.toLocaleString(undefined, { minimumFractionDigits: number < 10 ? 2 : 1, maximumFractionDigits: 2 });
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

function formatRelative(value) {
  if (!value) return "—";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86_400)}d`;
}

function ledgerLabel(type) {
  const labels = {
    dev_grant: "Development grant",
    weekly_grant: "Weekly Free Credits",
    invite_reward: "Invite reward",
    model_usage: "Model usage",
    reservation_settlement: "Model usage",
    admin_adjustment: "Adjustment",
  };
  return labels[type] || String(type || "Credit change").replaceAll("_", " ");
}

export default function AccountPage({ language = "en", setLanguage, onBack, onSignIn }) {
  const text = copy[language] || copy.en;
  const { status, account, logout, reloadMe, updateProfile } = useAuth();
  const [active, setActive] = useState("overview");
  const [data, setData] = useState({ credits: null, ledger: [], devices: [], sessions: [], usage: null, models: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  const email = account?.identities?.find((identity) => identity.type === "email")?.identifier || "";
  const name = account?.user?.displayName || (email ? email.split("@")[0] : "AporiaX");
  const initials = name.slice(0, 2).toUpperCase();

  useEffect(() => {
    setDisplayName(account?.user?.displayName || "");
  }, [account]);

  const refreshData = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    setError("");
    try {
      const [credits, ledger, devices, sessions, usage, models] = await Promise.all([
        api("/credits"),
        api("/credits/history?limit=50"),
        api("/devices"),
        api("/sessions"),
        api("/usage/summary?days=7"),
        api("/models"),
      ]);
      setData({ credits, ledger, devices, sessions, usage, models });
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

  async function grantDevCredits() {
    setError("");
    try {
      await api("/credits/dev-grant", { method: "POST", body: { credits: 100 } });
      await refreshData();
    } catch (err) {
      setError(err?.message || "DEV_GRANT_FAILED");
    }
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

  async function signOut() {
    await logout();
    onBack?.();
  }

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
            <span>{text.credits}</span>
            <strong>{formatCredits(data.credits?.balance)}</strong>
            <div><small>{text.available}</small><b>{formatCredits(data.credits?.available)}</b><small>{text.reserved}</small><b>{formatCredits(data.credits?.reserved)}</b></div>
          </article>
          <article className="account-metric"><span>{text.plan}</span><strong className="account-plan">{text.free}</strong><p>BYOK + Aporia Cloud Preview</p></article>
          <article className="account-metric"><span>{text.usage}</span><strong>{formatCredits(data.usage?.credits || 0)}</strong><p>{data.usage?.requestCount || 0} {text.requests} · {totalTokens.toLocaleString()} {text.tokens}</p></article>
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
            <div className="account-panel-title"><div><span>{text.recent}</span><small>{data.ledger.length}</small></div><button onClick={() => setActive("credits")}>↗</button></div>
            <div className="account-list">
              {data.ledger.length ? data.ledger.slice(0, 5).map((entry) => (
                <div className="account-row" key={entry.id}>
                  <span className={`ledger-dot ${entry.amountMicros >= 0 ? "ledger-dot--plus" : ""}`} />
                  <div><strong>{ledgerLabel(entry.type)}</strong><small>{formatDate(entry.createdAt)}</small></div>
                  <b className={entry.amountMicros >= 0 ? "credit-positive" : ""}>{entry.amountMicros >= 0 ? "+" : ""}{formatCredits(entry.amountMicros / 1_000_000)}</b>
                </div>
              )) : <p className="account-empty">{text.noActivity}</p>}
            </div>
          </article>
        </section>
      </>
    ),

    credits: (
      <>
        <section className="account-section-head"><p className="account-kicker">Credits</p><h1>{text.credits}</h1><p>{formatCredits(data.credits?.available)} {text.available.toLowerCase()} · {formatCredits(data.credits?.reserved)} {text.reserved.toLowerCase()}</p></section>
        <section className="account-metric-grid account-metric-grid--compact">
          <article className="account-metric account-metric--credit"><span>{text.credits}</span><strong>{formatCredits(data.credits?.balance)}</strong></article>
          <article className="account-metric"><span>{text.usage}</span><strong>{formatCredits(data.usage?.credits || 0)}</strong><p>{data.usage?.requestCount || 0} {text.requests}</p></article>
          <article className="account-metric"><span>{text.models}</span><strong>{data.models.length}</strong><p>{data.models.map((model) => model.displayName).slice(0, 2).join(" · ") || "—"}</p></article>
        </section>
        <section className="account-two-col account-two-col--credits">
          <article className="account-panel">
            <div className="account-panel-title"><div><span>{text.recent}</span><small>{data.ledger.length}</small></div></div>
            <div className="account-list account-list--scroll">
              {data.ledger.length ? data.ledger.map((entry) => (
                <div className="account-row" key={entry.id}><span className={`ledger-dot ${entry.amountMicros >= 0 ? "ledger-dot--plus" : ""}`} /><div><strong>{ledgerLabel(entry.type)}</strong><small>{new Date(entry.createdAt).toLocaleString()}</small></div><b className={entry.amountMicros >= 0 ? "credit-positive" : ""}>{entry.amountMicros >= 0 ? "+" : ""}{formatCredits(entry.amountMicros / 1_000_000)}</b></div>
              )) : <p className="account-empty">{text.noActivity}</p>}
            </div>
          </article>
          <article className="account-panel">
            <div className="account-panel-title"><div><span>{text.usage}</span><small>7d</small></div></div>
            <div className="usage-summary"><strong>{formatCredits(data.usage?.credits || 0)}</strong><span>Credits</span></div>
            <div className="usage-models">
              {(data.usage?.byModel || []).map((model) => <div key={model.model}><span>{model.model}</span><b>{formatCredits(model.credits)}</b><small>{model.requests} {text.requests}</small></div>)}
              {!data.usage?.byModel?.length ? <p className="account-empty">No model usage yet.</p> : null}
            </div>
            {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_CREDIT_GRANT === "true") ? <button className="dev-grant" onClick={grantDevCredits}>{text.devGrant}<small>{text.devOnly}</small></button> : null}
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
        <header className="account-topbar"><div><span className="cloud-dot" />Aporia Cloud</div><div><span>{formatCredits(data.credits?.available)} Credits</span><button type="button" onClick={() => setLanguage?.(language === "en" ? "zh" : "en")}>{language === "en" ? "中文" : "EN"}</button></div></header>
        <div className="account-content">
          {error ? <div className="account-error"><span>{error}</span><button type="button" onClick={refreshData}>{text.retry}</button></div> : null}
          {loading && !data.credits ? <div className="account-loading-inline">{text.loading}</div> : panels[active]}
        </div>
      </main>
    </div>
  );
}
