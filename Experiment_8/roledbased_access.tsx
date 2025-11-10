import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, Outlet, useLocation } from "react-router-dom";

/**
 * HARD: Role-Based Access Control (Admin/User/Moderator) with JWT
 * - React Router v6 protected & role-gated routes
 * - AuthContext with login/logout/refresh
 * - Axios-like request helper with interceptors (no external libs required)
 * - Token decoding + expiry check
 * - Demo mock API for login and refresh
 * - UI that changes based on roles
 *
 * ⚠️ Production notes:
 * - Store access tokens in memory; use refresh tokens in httpOnly secure cookies set by the server.
 * - Verify JWTs on the server for every privileged request.
 * - Rotate/short-lived access tokens; refresh silently; log out on refresh failure.
 */

// -------------------- JWT helpers --------------------
function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function isExpired(token) {
  const p = decodeJWT(token);
  if (!p?.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return p.exp <= now;
}

// -------------------- Mock API --------------------
// In a real app, replace these with fetch/axios calls to your backend.
const MockAPI = {
  async login(username, password) {
    await new Promise((r) => setTimeout(r, 600));
    if (!password || password.length < 6) throw new Error("Invalid credentials");

    // Assign roles by username for demo
    const roles = username === "admin"
      ? ["ADMIN", "USER"]
      : username === "mod" || username === "moderator"
      ? ["MODERATOR", "USER"]
      : ["USER"];

    const user = { id: 1, name: username, roles };
    const exp = Math.floor(Date.now() / 1000) + 60; // 1 minute access token
    const payload = btoa(JSON.stringify({ sub: user.id, name: user.name, roles, exp }));
    const accessToken = `header.${payload}.signature`;
    // In real world, refresh comes via httpOnly cookie; here we simulate as a string
    const refresh = cryptoRandom();
    return { user, accessToken, refreshToken: refresh };
  },

  async refresh(refreshToken) {
    await new Promise((r) => setTimeout(r, 400));
    if (!refreshToken || refreshToken.startsWith("x")) {
      const err = new Error("Refresh token invalid");
      err.status = 401;
      throw err;
    }
    const exp = Math.floor(Date.now() / 1000) + 60;
    const payload = btoa(JSON.stringify({ sub: 1, name: "demo", roles: ["USER"], exp }));
    const accessToken = `header.${payload}.signature`;
    return { accessToken };
  },

  async getSecret(resource) {
    // Simulate a protected API endpoint which requires a valid (non-expired) access token
    await new Promise((r) => setTimeout(r, 300));
    return { ok: true, data: `Top secret payload for ${resource}` };
  },
};

function cryptoRandom() {
  try {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

// -------------------- Request helper (axios-like) --------------------
function createHttp({ getAccessToken, onUnauthorized, tryRefresh }) {
  // Minimal wrapper around fetch with interceptors
  return {
    async get(url) {
      let token = getAccessToken();
      const res1 = await fetchWithAuth(url, token);
      if (res1.status !== 401) return res1;
      // try refresh once
      const refreshed = await tryRefresh();
      if (!refreshed) {
        onUnauthorized?.();
        return res1;
      }
      token = getAccessToken();
      const res2 = await fetchWithAuth(url, token);
      if (res2.status === 401) onUnauthorized?.();
      return res2;
    },
  };

  async function fetchWithAuth(url, token) {
    // For demo, just call MockAPI.getSecret and emulate Response
    if (!token || isExpired(token)) {
      return { status: 401, json: async () => ({ error: "Unauthorized" }) };
    }
    const data = await MockAPI.getSecret(url);
    return { status: 200, json: async () => data };
  }
}

// -------------------- Auth Context --------------------
const AuthCtx = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, name, roles }
  const [accessToken, setAccessToken] = useState(null);
  const refreshRef = useRef(null); // pretend we got this via httpOnly cookie
  const [loading, setLoading] = useState(true);

  // Boot: load from storage for demo
  useEffect(() => {
    const saved = localStorage.getItem("demo_auth");
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed.user ?? null);
      setAccessToken(parsed.accessToken ?? null);
      refreshRef.current = parsed.refreshToken ?? null;
    }
    setLoading(false);
  }, []);

  // Persist for demo
  useEffect(() => {
    const toSave = JSON.stringify({ user, accessToken, refreshToken: refreshRef.current });
    localStorage.setItem("demo_auth", toSave);
  }, [user, accessToken]);

  const login = useCallback(async (username, password) => {
    const { user, accessToken, refreshToken } = await MockAPI.login(username, password);
    setUser(user);
    setAccessToken(accessToken);
    refreshRef.current = refreshToken;
    return user;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    refreshRef.current = null;
    localStorage.removeItem("demo_auth");
  }, []);

  const tryRefresh = useCallback(async () => {
    try {
      const { accessToken } = await MockAPI.refresh(refreshRef.current);
      setAccessToken(accessToken);
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const hasAnyRole = useCallback(
    (roles) => {
      if (!roles || roles.length === 0) return true;
      const current = user?.roles ?? [];
      return roles.some((r) => current.includes(r));
    },
    [user]
  );

  const http = useMemo(
    () => createHttp({ getAccessToken: () => accessToken, onUnauthorized: logout, tryRefresh }),
    [accessToken, logout, tryRefresh]
  );

  const value = useMemo(
    () => ({ user, accessToken, loading, login, logout, tryRefresh, hasAnyRole, http }),
    [user, accessToken, loading, login, logout, tryRefresh, hasAnyRole, http]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// -------------------- Route Guards --------------------
function RequireAuth() {
  const { user, accessToken, loading } = useAuth();
  const location = useLocation();

  if (loading) return <ScreenMsg>Loading session…</ScreenMsg>;
  if (!user || !accessToken || isExpired(accessToken)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

function RequireRoles({ roles }) {
  const { hasAnyRole } = useAuth();
  if (!hasAnyRole(roles)) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
}

// -------------------- UI Components --------------------
function AppShell() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto flex items-center justify-between p-4">
          <Link to="/" className="font-semibold">RBAC Demo</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="hover:underline" to="/">Home</Link>
            <Link className="hover:underline" to="/dashboard">Dashboard</Link>
            <Link className="hover:underline" to="/admin">Admin</Link>
            <Link className="hover:underline" to="/moderator">Moderator</Link>
            <Link className="hover:underline" to="/user">User</Link>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600">Hi, {user.name}</span>
                <RoleChips roles={user.roles} />
                <button
                  onClick={logout}
                  className="text-sm rounded-xl bg-gray-900 text-white px-3 py-1.5 hover:opacity-90"
                >Logout</button>
              </>
            ) : (
              <Link to="/login" className="text-sm rounded-xl bg-indigo-600 text-white px-3 py-1.5 hover:bg-indigo-700">Login</Link>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-6">
        <Outlet />
      </main>
      <footer className="max-w-5xl mx-auto p-6 text-xs text-gray-500">Demo only. Replace mock API with your backend.</footer>
    </div>
  );
}

function RoleChips({ roles }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {roles?.map((r) => (
        <span key={r} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-200">{r}</span>
      ))}
    </div>
  );
}

function ScreenMsg({ children }) {
  return (
    <div className="h-[60vh] grid place-items-center text-gray-600">{children}</div>
  );
}

// -------------------- Pages --------------------
function Home() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Role-Based Access Control (JWT)</h1>
      <p className="text-gray-600">Use demo users to explore:</p>
      <ul className="list-disc pl-5 text-sm text-gray-700">
        <li><span className="font-mono">admin / secret123</span> → roles: ADMIN, USER</li>
        <li><span className="font-mono">mod / secret123</span> → roles: MODERATOR, USER</li>
        <li><span className="font-mono">alice / secret123</span> → roles: USER</li>
      </ul>
    </div>
  );
}

function Login() {
  const { login } = useAuth();
  const location = useLocation();
  
