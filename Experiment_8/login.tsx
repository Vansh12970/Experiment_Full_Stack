import React, { useState } from "react";

// Easy login form with React state management
// - Manages email, password, remember me, show password
// - Simple client-side validation and submit simulation
// - Accessible labels, aria-live regions, and keyboard friendly

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverError, setServerError] = useState<string>("");

  function validate() {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) next.email = "Enter a valid email";
    if (!password) next.password = "Password is required";
    else if (password.length < 6) next.password = "Min 6 characters";
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    setStatus("submitting");
    try {
      // Simulate API request
      await new Promise((r) => setTimeout(r, 900));

      // Fake auth condition: password === "secret123"
      if (password !== "secret123") {
        throw new Error("Invalid email or password");
      }
      setStatus("success");
    } catch (err: any) {
      setServerError(err?.message || "Login failed");
      setStatus("error");
    } finally {
      // If "remember me" is checked, you might persist email in localStorage
      if (remember) {
        try { localStorage.setItem("saved_email", email); } catch {}
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-lg rounded-2xl p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to continue</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={`mt-1 w-full rounded-xl border px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-2 my-auto rounded-lg px-2 text-sm text-gray-600 hover:bg-gray-100"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Remember me
              </label>
              <button type="button" className="text-sm text-indigo-600 hover:underline">
                Forgot password?
              </button>
            </div>

            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert" aria-live="polite">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            >
              {status === "submitting" ? "Signing in…" : "Sign in"}
            </button>

            {status === "success" && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3" aria-live="polite">
                Logged in successfully! (Demo password is <code>secret123</code>)
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            New here? <a href="#" className="text-indigo-600 hover:underline">Create an account</a>
          </p>
        </div>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Tip: Replace the fake check with your real API call. Keep auth tokens in httpOnly cookies for security.
        </p>
      </div>
    </div>
  );
}
