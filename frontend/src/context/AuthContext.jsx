import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { setAuthToken } from "../api/client";

const AuthContext = createContext(null);

function loadTokens() {
  return {
    access: localStorage.getItem("accessToken"),
    refresh: localStorage.getItem("refreshToken"),
  };
}

export function AuthProvider({ children }) {
  const [tokens, setTokens] = useState(loadTokens);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        // Important: set header BEFORE calling /me (dev StrictMode double-effects can race otherwise)
        setAuthToken(tokens?.access);
        if (tokens?.access) {
          const res = await api.get("/auth/me/");
          if (!cancelled) setUser(res.data);
        } else {
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [tokens?.access]);

  const login = async ({ username, password }) => {
    const res = await api.post("/auth/login/", { username, password });
    const { access, refresh } = res.data;
    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
    setAuthToken(access);
    setTokens({ access, refresh });
    const me = await api.get("/auth/me/");
    setUser(me.data);
    return me.data;
  };

  const register = async ({ username, email, password }) => {
    const res = await api.post("/auth/register/", {
      username,
      email,
      password,
      role: "merchant",
    });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setTokens({ access: null, refresh: null });
    setUser(null);
    setAuthToken(null);
  };

  const value = useMemo(
    () => ({
      user,
      tokens,
      loading,
      login,
      register,
      logout,
      isAdmin: user?.role === "admin",
    }),
    [user, tokens, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

