import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, logoutWebSession, refreshWebSession, requestEmailCode, setAccessToken, verifyEmailCode } from "../api/client.js";
import {
  PREVIEW_ACCOUNT,
  PREVIEW_ACCOUNT_DATA,
  isPreviewLogin,
  readPreviewSession,
  writePreviewSession,
} from "./preview-session.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("booting");
  const [account, setAccount] = useState(null);
  const [preview, setPreview] = useState(false);

  const loadMe = useCallback(async () => {
    const me = await api("/me");
    setAccount(me);
    setStatus("authenticated");
    return me;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (readPreviewSession()) {
        if (!cancelled) {
          setPreview(true);
          setAccount(PREVIEW_ACCOUNT);
          setStatus("authenticated");
        }
        return;
      }
      try {
        await refreshWebSession();
        const me = await api("/me", {}, false);
        if (!cancelled) {
          setAccount(me);
          setStatus("authenticated");
        }
      } catch {
        setAccessToken(null);
        if (!cancelled) {
          setAccount(null);
          setStatus("anonymous");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const requestCode = useCallback((email, inviteCode = "") => requestEmailCode(email, inviteCode), []);

  const verifyCode = useCallback(async (email, code, inviteCode = "") => {
    const result = await verifyEmailCode(email, code, inviteCode);
    await loadMe();
    return result;
  }, [loadMe]);

  const enterPreview = useCallback(() => {
    writePreviewSession(true);
    setPreview(true);
    setAccount(PREVIEW_ACCOUNT);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    const wasPreview = preview;
    writePreviewSession(false);
    setPreview(false);
    if (wasPreview) setAccessToken(null);
    else await logoutWebSession().catch(() => undefined);
    setAccount(null);
    setStatus("anonymous");
  }, [preview]);

  const updateProfile = useCallback(async (displayName) => {
    if (preview) {
      setAccount((current) => ({
        ...current,
        user: { ...(current?.user || {}), displayName },
      }));
      return;
    }
    await api("/me", { method: "PATCH", body: { displayName } });
    return loadMe();
  }, [loadMe, preview]);

  const value = useMemo(() => ({
    status,
    account,
    preview,
    previewData: preview ? PREVIEW_ACCOUNT_DATA : null,
    requestCode,
    verifyCode,
    enterPreview,
    isPreviewLogin,
    logout,
    reloadMe: loadMe,
    updateProfile,
  }), [status, account, preview, requestCode, verifyCode, enterPreview, logout, loadMe, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
