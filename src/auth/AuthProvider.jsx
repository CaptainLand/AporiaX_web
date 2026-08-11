import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, logoutWebSession, refreshWebSession, requestEmailCode, setAccessToken, verifyEmailCode } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("booting");
  const [account, setAccount] = useState(null);

  const loadMe = useCallback(async () => {
    const me = await api("/me");
    setAccount(me);
    setStatus("authenticated");
    return me;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
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

  const requestCode = useCallback((email) => requestEmailCode(email), []);

  const verifyCode = useCallback(async (email, code) => {
    await verifyEmailCode(email, code);
    return loadMe();
  }, [loadMe]);

  const logout = useCallback(async () => {
    await logoutWebSession().catch(() => undefined);
    setAccount(null);
    setStatus("anonymous");
  }, []);

  const updateProfile = useCallback(async (displayName) => {
    await api("/me", { method: "PATCH", body: { displayName } });
    return loadMe();
  }, [loadMe]);

  const value = useMemo(() => ({
    status,
    account,
    requestCode,
    verifyCode,
    logout,
    reloadMe: loadMe,
    updateProfile,
  }), [status, account, requestCode, verifyCode, logout, loadMe, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
