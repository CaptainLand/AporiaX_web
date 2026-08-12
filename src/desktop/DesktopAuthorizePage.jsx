import { useEffect, useMemo, useRef, useState } from "react";
import { authorizeDesktopLogin } from "../api/client.js";
import AuthModal from "../auth/AuthModal.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import "./desktop-authorize.css";

const APORIAX_DESKTOP_CLIENT_ID = "aporiax-desktop";

const copy = {
  en: {
    eyebrow: "AporiaX Desktop",
    title: "Continue to AporiaX Desktop",
    lead: "Confirm this browser sign-in to connect the desktop app to your Aporia Account.",
    account: "Account",
    device: "Device",
    platform: "Platform",
    version: "App version",
    permissionTitle: "This will allow AporiaX Desktop to",
    permissions: [
      "Use your Aporia Account identity",
      "Read your weekly quota and available Cloud models",
      "Register this computer as a connected desktop device",
    ],
    localNote: "Your local projects, source code and workspace files are not uploaded by this sign-in.",
    security: "Only continue if you started this request from AporiaX Desktop on this computer.",
    signin: "Sign in to continue",
    continue: "Continue",
    cancel: "Cancel",
    connecting: "Connecting desktop…",
    booting: "Checking your Aporia Account…",
    invalidTitle: "This desktop sign-in link is invalid",
    invalidLead: "Return to AporiaX Desktop and start sign-in again. Desktop authorization links are short-lived launch requests and must use a local callback.",
    authError: "Unable to authorize AporiaX Desktop.",
    back: "Back to AporiaX",
  },
  zh: {
    eyebrow: "AporiaX Desktop",
    title: "继续登录 AporiaX 桌面端",
    lead: "确认本次浏览器登录，将桌面端连接到你的 Aporia Account。",
    account: "账号",
    device: "设备",
    platform: "平台",
    version: "应用版本",
    permissionTitle: "确认后，AporiaX Desktop 可以",
    permissions: [
      "使用你的 Aporia Account 身份",
      "读取周额度与可用 Cloud 模型",
      "把这台电脑登记为已连接的桌面设备",
    ],
    localNote: "登录不会上传你的本地项目、源代码或工作区文件。",
    security: "仅当你刚刚在这台电脑的 AporiaX Desktop 中发起登录时继续。",
    signin: "登录后继续",
    continue: "确认并连接",
    cancel: "取消",
    connecting: "正在连接桌面端…",
    booting: "正在检查 Aporia Account…",
    invalidTitle: "这个桌面端登录链接无效",
    invalidLead: "请返回 AporiaX Desktop 重新发起登录。桌面授权必须使用本机回调地址和完整的 PKCE 参数。",
    authError: "无法授权 AporiaX Desktop。",
    back: "返回 AporiaX",
  },
};

function baseHome() {
  return import.meta.env.BASE_URL || "/";
}

function normalizeLoopbackRedirect(raw) {
  try {
    const url = new URL(raw);
    const port = Number(url.port);
    if (
      url.protocol !== "http:" ||
      url.hostname !== "127.0.0.1" ||
      !url.port ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535 ||
      url.username ||
      url.password ||
      url.hash
    ) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function readDesktopRequest() {
  const params = new URLSearchParams(window.location.search);
  const clientId = params.get("client_id") || "";
  const redirectUri = normalizeLoopbackRedirect(params.get("redirect_uri") || "");
  const codeChallenge = params.get("code_challenge") || "";
  const codeChallengeMethod = params.get("code_challenge_method") || "";
  const state = params.get("state") || "";
  const deviceName = (params.get("device_name") || "AporiaX Desktop").trim();
  const platform = (params.get("platform") || "Windows").trim();
  const appVersion = (params.get("app_version") || "").trim();

  const valid = clientId === APORIAX_DESKTOP_CLIENT_ID
    && Boolean(redirectUri)
    && /^[A-Za-z0-9_-]{43}$/.test(codeChallenge)
    && codeChallengeMethod === "S256"
    && /^[A-Za-z0-9._~-]{16,256}$/.test(state)
    && deviceName.length >= 1 && deviceName.length <= 120
    && platform.length >= 1 && platform.length <= 80
    && appVersion.length <= 40;

  return valid ? {
    clientId,
    redirectUri,
    codeChallenge,
    codeChallengeMethod,
    state,
    device: {
      name: deviceName,
      platform,
      ...(appVersion ? { appVersion } : {}),
    },
  } : null;
}

export default function DesktopAuthorizePage() {
  const { status, account } = useAuth();
  const [language, setLanguage] = useState(() => window.localStorage.getItem("aporia-language") || "en");
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const prompted = useRef(false);
  const request = useMemo(() => readDesktopRequest(), []);
  const text = copy[language] || copy.en;

  useEffect(() => {
    window.localStorage.setItem("aporia-language", language);
  }, [language]);

  useEffect(() => {
    if (!request || status !== "anonymous" || prompted.current) return;
    prompted.current = true;
    setModal("signin");
  }, [request, status]);

  const identity = account?.identities?.find((item) => item.type === "email")?.identifier || "";
  const accountName = account?.user?.displayName || identity.split("@")[0] || "Aporia Account";
  const initials = accountName.slice(0, 2).toUpperCase();

  async function confirm() {
    if (!request || status !== "authenticated" || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await authorizeDesktopLogin({
        clientId: request.clientId,
        redirectUri: request.redirectUri,
        codeChallenge: request.codeChallenge,
        codeChallengeMethod: request.codeChallengeMethod,
        state: request.state,
        device: request.device,
      });
      if (!result?.redirectUrl) throw new Error(text.authError);
      window.location.replace(result.redirectUrl);
    } catch (err) {
      setError(err?.message || text.authError);
      setBusy(false);
    }
  }

  function cancel() {
    if (!request) {
      window.location.assign(baseHome());
      return;
    }
    const callback = new URL(request.redirectUri);
    callback.searchParams.set("error", "access_denied");
    callback.searchParams.set("state", request.state);
    window.location.replace(callback.toString());
  }

  if (!request) {
    return (
      <main className="desktop-auth-page">
        <div className="desktop-auth-glow" aria-hidden="true" />
        <section className="desktop-auth-card desktop-auth-card--compact">
          <div className="desktop-auth-brand"><span className="desktop-auth-mark">AX</span><span>AporiaX</span></div>
          <p className="desktop-auth-eyebrow">{text.eyebrow}</p>
          <h1>{text.invalidTitle}</h1>
          <p className="desktop-auth-lead">{text.invalidLead}</p>
          <a className="desktop-auth-primary desktop-auth-link" href={baseHome()}>{text.back}</a>
        </section>
      </main>
    );
  }

  return (
    <main className="desktop-auth-page">
      <div className="desktop-auth-glow" aria-hidden="true" />
      <section className="desktop-auth-card">
        <header className="desktop-auth-topbar">
          <div className="desktop-auth-brand"><span className="desktop-auth-mark">AX</span><span>AporiaX</span></div>
          <button className="desktop-auth-language" type="button" onClick={() => setLanguage((value) => value === "en" ? "zh" : "en")}>{language === "en" ? "中文" : "EN"}</button>
        </header>

        <div className="desktop-auth-heading">
          <p className="desktop-auth-eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p className="desktop-auth-lead">{text.lead}</p>
        </div>

        {status === "booting" ? (
          <div className="desktop-auth-state"><span className="desktop-auth-spinner" />{text.booting}</div>
        ) : (
          <>
            <div className="desktop-auth-summary">
              <div className="desktop-auth-account">
                <span className="desktop-auth-avatar">{initials}</span>
                <div><span>{text.account}</span><strong>{status === "authenticated" ? accountName : "Aporia Account"}</strong><small>{status === "authenticated" ? identity : "—"}</small></div>
              </div>
              <div className="desktop-auth-device-grid">
                <div><span>{text.device}</span><strong>{request.device.name}</strong></div>
                <div><span>{text.platform}</span><strong>{request.device.platform}</strong></div>
                {request.device.appVersion ? <div><span>{text.version}</span><strong>{request.device.appVersion}</strong></div> : null}
              </div>
            </div>

            <div className="desktop-auth-permissions">
              <strong>{text.permissionTitle}</strong>
              {text.permissions.map((item) => <div key={item}><span>✓</span><p>{item}</p></div>)}
            </div>

            <div className="desktop-auth-local-note"><span>⌁</span><p>{text.localNote}</p></div>
            <p className="desktop-auth-security">{text.security}</p>
            {error ? <div className="desktop-auth-error">{error}</div> : null}

            <div className="desktop-auth-actions">
              <button className="desktop-auth-secondary" type="button" disabled={busy} onClick={cancel}>{text.cancel}</button>
              {status === "authenticated" ? (
                <button className="desktop-auth-primary" type="button" disabled={busy} onClick={confirm}>{busy ? text.connecting : text.continue}</button>
              ) : (
                <button className="desktop-auth-primary" type="button" onClick={() => setModal("signin")}>{text.signin}</button>
              )}
            </div>
          </>
        )}
      </section>

      <AuthModal mode={modal} onClose={() => setModal(null)} language={language} onAuthenticated={() => setModal(null)} />
    </main>
  );
}
