// Medium: Implement Protected Routes with JWT verification
// Stack: React Router + localStorage + token decode + auto-redirect
// Note: Replace the mock validateToken() with your real backend check.

import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

// --- Utility: Decode JWT payload (without verifying signature) ---
function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

// --- Mock server validation ---
async function validateToken(token) {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 800));

  const data = decodeJWT(token);
  if (!data) return false;

  const now = Math.floor(Date.now() / 1000);
  return data.exp && data.exp > now; // token not expired
}

// --- Protected Route Component ---
export function ProtectedRoute() {
  const [isValid, setIsValid] = useState(null); // null = loading, true/false

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsValid(false);
      return;
    }

    validateToken(token).then((ok) => setIsValid(ok));
  }, []);

  if (isValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-lg">
        Checking authentication...
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  // If valid → allow access
  return <Outlet />;
}

// --- Example Login Page (issues a fake JWT) ---
export function LoginPage() {
  function handleLogin() {
    // Fake token: expires in 1 minute
    const exp = Math.floor(Date.now() / 1000) + 60;
    const fakePayload = btoa(JSON.stringify({ user: "demo", exp }));
    const token = `header.${fakePayload}.signature`;
    localStorage.setItem("access_token", token);
    window.location.href = "/dashboard";
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <button
        onClick={handleLogin}
        className="bg-indigo-600 text-white px-4 py-2 rounded-xl"
      >
        Login (Fake JWT)
      </button>
    </div>
  );
}

// --- Example Dashboard (protected) ---
export function Dashboard() {
  return (
    <div className="h-screen flex items-center justify-center text-2xl font-semibold">
    You are inside a protected dashboard
    </div>
  );
}

// --- App.jsx Routing Setup ---
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { ProtectedRoute, LoginPage, Dashboard } from "./ProtectedRouteDemo";
//
// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/login" element={<LoginPage />} />
//
//         {/* Protected Routes Wrapper */}
//         <Route element={<ProtectedRoute />}> 
//           <Route path="/dashboard" element={<Dashboard />} />
//         </Route>
//       </Routes>
//     </BrowserRouter>
//   );
// }
