import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import "./Login.css";
import { isLoggedIn } from "../auth";



// Match these to your Django server and your login serializer
const LOGIN_URL = "/api/login/";
const USERNAME_FIELD = "username"; // use "email" if your Django login expects email

function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

 if (isLoggedIn()) {
  return <Navigate to="/dashboard" replace />;
}
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [USERNAME_FIELD]: identifier.trim(), password }),
      });

      if (res.status === 400 || res.status === 401) {
        setError("Incorrect username or password.");
        return;
      }
      if (!res.ok) {
        setError(`Login request failed (error ${res.status}). Check the login URL.`);
        return;
      }

      const data = await res.json();
      localStorage.setItem("access", data.access);
      if (data.refresh) localStorage.setItem("refresh", data.refresh);
      // Needed by the Assets/Inventory/Tickets pages to show admin forms
      localStorage.setItem("username", data.username || identifier.trim());
      localStorage.setItem("role", data.role || "Employee");

      navigate("/dashboard", { replace: true });
    } catch {
      setError("Can't reach the server. Check that Django is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <aside className="login-brand">
        <h1>Asset Management</h1>
        <p className="login-brand-lead">
          One place to track company equipment from purchase to retirement.
        </p>
        <ul className="login-brand-list">
          <li>See which assets are assigned, in storage or under repair</li>
          <li>Keep inventory counts current</li>
          <li>Raise and follow up on support tickets</li>
        </ul>
      </aside>

      <main className="login-panel">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <h2>Sign in</h2>
          <p className="login-sub">Use the account your administrator created for you.</p>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <label htmlFor="identifier">Username</label>
          <input
            id="identifier"
            type="text"
            autoComplete="username"
            autoFocus
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={loading}
          />

          <label htmlFor="password">Password</label>
          <div className="login-password">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="login-toggle"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="login-help">
            Forgot your password? Ask your administrator to reset it.
          </p>
        </form>
      </main>
    </div>
  );
}

export default Login;