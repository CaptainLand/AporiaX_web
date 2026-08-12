import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider.jsx";

const PENDING_VERIFICATION_KEY = "aporiax.pending-email-verification.v1";
const DEFAULT_OTP_TTL_MS = 10 * 60_000;
const RESEND_COOLDOWN_MS = 60_000;

const copy = {
  en: {
    signin: "Sign in to AporiaX",
    signup: "Create your AporiaX account",
    lead: "One email. No password. Your account connects Credits, devices and future remote sessions.",
    email: "Email",
    code: "Verification code",
    send: "Continue",
    verify: "Sign in",
    back: "Use another email",
    sent: "We sent a 6-digit code to",
    ready: "Verification is ready for",
    dev: "Local development does not send email. Read the 6-digit verification code from the AporiaX Cloud API terminal.",
    resend: "Resend code",
    resendIn: "Resend code in",
    expiresIn: "Code expires in",
    rateLimited: "Please wait a minute before requesting another code.",
    sendError: "Unable to send code.",
    invalidCode: "The code is invalid or expired.",
    verifyError: "Unable to sign in.",
    expired: "That verification code expired. Request a new code to continue.",
    close: "Close",
  },
  zh: {
    signin: "登录 AporiaX",
    signup: "创建 AporiaX 账号",
    lead: "只需要邮箱，不需要密码。账号用于连接 Credits、设备与未来的远程会话。",
    email: "邮箱",
    code: "验证码",
    send: "继续",
    verify: "登录",
    back: "换一个邮箱",
    sent: "6 位验证码已发送至",
    ready: "验证码已为以下邮箱生成",
    dev: "本地开发环境不会真正发送邮件。请在 AporiaX Cloud API 终端中查看 6 位验证码。",
    resend: "重新发送验证码",
    resendIn: "可重新发送倒计时",
    expiresIn: "验证码剩余有效时间",
    rateLimited: "请等待一分钟后再重新请求验证码。",
    sendError: "无法发送验证码。",
    invalidCode: "验证码无效或已过期。",
    verifyError: "无法登录。",
    expired: "验证码已过期，请重新获取验证码。",
    close: "关闭",
  },
};

function readPendingVerification() {
  try {
    const raw = window.sessionStorage.getItem(PENDING_VERIFICATION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!value?.email || !Number.isFinite(value.requestedAt) || !Number.isFinite(value.expiresAt)) {
      window.sessionStorage.removeItem(PENDING_VERIFICATION_KEY);
      return null;
    }
    if (value.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(PENDING_VERIFICATION_KEY);
      return null;
    }
    return value;
  } catch {
    window.sessionStorage.removeItem(PENDING_VERIFICATION_KEY);
    return null;
  }
}

function savePendingVerification(email, expiresInSeconds) {
  const requestedAt = Date.now();
  const ttlMs = Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
    ? expiresInSeconds * 1000
    : DEFAULT_OTP_TTL_MS;
  const pending = { email, requestedAt, expiresAt: requestedAt + ttlMs };
  window.sessionStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(pending));
  return pending;
}

function clearPendingVerification() {
  window.sessionStorage.removeItem(PENDING_VERIFICATION_KEY);
}

function formatCountdown(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export default function AuthModal({ mode, onClose, language = "en", onAuthenticated }) {
  const { requestCode, verifyCode } = useAuth();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const text = copy[language] || copy.en;

  useEffect(() => {
    if (!mode) return;
    const restored = readPendingVerification();
    setCode("");
    setError("");
    setNow(Date.now());
    if (restored) {
      setPending(restored);
      setEmail(restored.email);
      setStep("code");
    } else {
      setPending(null);
      setEmail("");
      setStep("email");
    }
  }, [mode]);

  useEffect(() => {
    if (!mode) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, onClose]);

  useEffect(() => {
    if (!mode || step !== "code" || !pending) return undefined;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [mode, step, pending]);

  useEffect(() => {
    if (!pending || now < pending.expiresAt) return;
    clearPendingVerification();
    setPending(null);
    setStep("email");
    setCode("");
    setError(text.expired);
  }, [now, pending, text.expired]);

  if (!mode) return null;

  const resendSeconds = pending
    ? Math.max(0, Math.ceil((pending.requestedAt + RESEND_COOLDOWN_MS - now) / 1000))
    : 0;
  const expirySeconds = pending
    ? Math.max(0, Math.ceil((pending.expiresAt - now) / 1000))
    : 0;

  async function submitEmail(event) {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail) return;
    setBusy(true);
    setError("");
    try {
      const result = await requestCode(normalizedEmail);
      const nextPending = savePendingVerification(normalizedEmail, result?.expiresInSeconds);
      setEmail(normalizedEmail);
      setPending(nextPending);
      setNow(Date.now());
      setStep("code");
    } catch (err) {
      setError(err?.message === "OTP_RATE_LIMITED" ? text.rateLimited : err?.message || text.sendError);
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(event) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) return;
    setBusy(true);
    setError("");
    try {
      await verifyCode(email.trim(), code);
      clearPendingVerification();
      setPending(null);
      onClose();
      onAuthenticated?.();
    } catch (err) {
      setError(err?.message === "OTP_INVALID" ? text.invalidCode : err?.message || text.verifyError);
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    if (busy || resendSeconds > 0) return;
    setBusy(true);
    setError("");
    try {
      const result = await requestCode(email.trim());
      const nextPending = savePendingVerification(email.trim(), result?.expiresInSeconds);
      setPending(nextPending);
      setCode("");
      setNow(Date.now());
    } catch (err) {
      setError(err?.message === "OTP_RATE_LIMITED" ? text.rateLimited : err?.message || text.sendError);
    } finally {
      setBusy(false);
    }
  }

  function useAnotherEmail() {
    clearPendingVerification();
    setPending(null);
    setStep("email");
    setEmail("");
    setCode("");
    setError("");
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="account-modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label={text.close}>×</button>
        <div className="modal-orbit" aria-hidden="true" />
        <p className="section-kicker">Aporia Account</p>
        <h2 id="auth-title">{mode === "signup" ? text.signup : text.signin}</h2>
        <p>{text.lead}</p>

        {step === "email" ? (
          <form className="auth-form" onSubmit={submitEmail}>
            <label>
              <span>{text.email}</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="you@example.com" autoFocus />
            </label>
            {error ? <p className="auth-error" role="alert">{error}</p> : null}
            <button className="button button--primary button--wide" type="submit" disabled={busy || !email.trim()}>{busy ? "…" : text.send}</button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submitCode}>
            <p className="auth-sent">{import.meta.env.DEV ? text.ready : text.sent} <strong>{email}</strong></p>
            <label>
              <span>{text.code}</span>
              <input className="auth-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" autoFocus />
            </label>
            <div className="auth-code-meta">
              <span>{text.expiresIn} {formatCountdown(expirySeconds)}</span>
              <button className="auth-resend" type="button" onClick={resendCode} disabled={busy || resendSeconds > 0}>
                {resendSeconds > 0 ? `${text.resendIn} ${resendSeconds}s` : text.resend}
              </button>
            </div>
            {import.meta.env.DEV ? <p className="auth-dev-note">{text.dev}</p> : null}
            {error ? <p className="auth-error" role="alert">{error}</p> : null}
            <button className="button button--primary button--wide" type="submit" disabled={busy || code.length !== 6}>{busy ? "…" : text.verify}</button>
            <button className="auth-back" type="button" onClick={useAnotherEmail}>{text.back}</button>
          </form>
        )}
      </section>
    </div>
  );
}
