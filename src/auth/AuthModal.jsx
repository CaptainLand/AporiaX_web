import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider.jsx";

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
    dev: "Local development: the verification code is printed in the AporiaX Cloud API terminal.",
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
    dev: "本地开发时，验证码会打印在 AporiaX Cloud API 的终端里。",
    close: "关闭",
  },
};

export default function AuthModal({ mode, onClose, language = "en", onAuthenticated }) {
  const { requestCode, verifyCode } = useAuth();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const text = copy[language] || copy.en;

  useEffect(() => {
    if (!mode) return undefined;
    setStep("email");
    setEmail("");
    setCode("");
    setError("");
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, onClose]);

  if (!mode) return null;

  async function submitEmail(event) {
    event.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError("");
    try {
      await requestCode(email.trim());
      setStep("code");
    } catch (err) {
      setError(err?.message === "OTP_RATE_LIMITED" ? "Please wait a minute before requesting another code." : err?.message || "Unable to send code.");
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
      onClose();
      onAuthenticated?.();
    } catch (err) {
      setError(err?.message === "OTP_INVALID" ? "The code is invalid or expired." : err?.message || "Unable to sign in.");
    } finally {
      setBusy(false);
    }
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
            <p className="auth-sent">{text.sent} <strong>{email}</strong></p>
            <label>
              <span>{text.code}</span>
              <input className="auth-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" autoFocus />
            </label>
            {import.meta.env.DEV ? <p className="auth-dev-note">{text.dev}</p> : null}
            {error ? <p className="auth-error" role="alert">{error}</p> : null}
            <button className="button button--primary button--wide" type="submit" disabled={busy || code.length !== 6}>{busy ? "…" : text.verify}</button>
            <button className="auth-back" type="button" onClick={() => { setStep("email"); setCode(""); setError(""); }}>{text.back}</button>
          </form>
        )}
      </section>
    </div>
  );
}
