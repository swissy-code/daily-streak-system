
import { useState } from "react";
import API from "./api/api";
import Dashboard from "./Dashboard";
import AdminDashboard from "./AdminDashboard";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return false;
    }

    try {
      JSON.parse(user);
      return true;
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return false;
    }
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      setIsLoggedIn(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await API.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password
      });

      setIsRegistering(false);
      setName("");
      setPassword("");
      setSuccess("Account created successfully! Please log in.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  };

  if (isLoggedIn) {
    let user = {};

    try {
      user = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
    }

    if (user?.role === "ADMIN") {
      return <AdminDashboard />;
    }

    return <Dashboard />;
  }

  return (
    <main className="velo-auth-page">
      <div className="velo-background-glow glow-one"></div>
      <div className="velo-background-glow glow-two"></div>

      <header className="velo-navbar">
        <a href="/" className="velo-brand">
          <div className="velo-brand-icon">
            <span>V</span>
          </div>
          <div>
            <h2>VELOOP</h2>
            <span>R E W A R D S</span>
          </div>
        </a>

        <div className="velo-nav-tag">
          <span className="status-dot"></span>
          Rewards that keep you moving
        </div>
      </header>

      <section className="velo-auth-layout">
        <div className="velo-hero">
          <div className="velo-hero-label">
            <span>✦</span> YOUR DAILY REWARDS EXPERIENCE
          </div>

          <h1>
            Every day is
            <br />
            another chance
            <br />
            to <span>earn more.</span>
          </h1>

          <p className="velo-hero-description">
            Stay consistent, build your streak, collect VE points
            and unlock exciting rewards with VELOOP.
          </p>

          <div className="velo-feature-list">
            <div className="velo-feature">
              <div className="feature-icon">🔥</div>
              <div>
                <strong>Build your streak</strong>
                <span>Make every day count.</span>
              </div>
            </div>

            <div className="velo-feature">
              <div className="feature-icon">◈</div>
              <div>
                <strong>Earn VE points</strong>
                <span>Get rewarded for consistency.</span>
              </div>
            </div>

            <div className="velo-feature">
              <div className="feature-icon">🎁</div>
              <div>
                <strong>Unlock rewards</strong>
                <span>Turn progress into rewards.</span>
              </div>
            </div>
          </div>

          <div className="velo-hero-bottom">
            <span className="hero-line"></span>
            <span>CONSISTENCY. PROGRESS. REWARDS.</span>
          </div>
        </div>

        <div className="velo-form-wrapper">
          <div className="velo-form-card">
            <div className="velo-form-heading">
              <div className="velo-form-symbol">✦</div>
              <span className="velo-form-eyebrow">
                WELCOME TO VELOOP
              </span>

              <h2>
                {isRegistering ? "Create account" : "Welcome back"}
              </h2>

              <p>
                {isRegistering
                  ? "Create your account and start earning rewards."
                  : "Sign in to continue your rewards journey."}
              </p>
            </div>

            <div className="velo-auth-tabs">
              <button
                type="button"
                className={!isRegistering ? "active" : ""}
                onClick={() => {
                  setIsRegistering(false);
                  setError("");
                  setSuccess("");
                }}
              >
                Login
              </button>

              <button
                type="button"
                className={isRegistering ? "active" : ""}
                onClick={() => {
                  setIsRegistering(true);
                  setError("");
                  setSuccess("");
                }}
              >
                Create account
              </button>
            </div>

            <form
              className="velo-form"
              onSubmit={isRegistering ? handleRegister : handleLogin}
            >
              {isRegistering && (
                <div className="velo-field">
                  <label htmlFor="full-name">Full name</label>
                  <div className="velo-input-wrap">
                    <span>♙</span>
                    <input
                      id="full-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="velo-field">
                <label htmlFor="email">Email address</label>
                <div className="velo-input-wrap">
                  <span>✉</span>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="velo-field">
                <label htmlFor="password">Password</label>
                <div className="velo-input-wrap">
                  <span>♙</span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={
                      isRegistering ? "new-password" : "current-password"
                    }
                    required
                  />

                  <button
                    type="button"
                    className="velo-show-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="velo-message error-message">
                  {error}
                </div>
              )}

              {success && (
                <div className="velo-message success-message">
                  {success}
                </div>
              )}

              <button
                type="submit"
                className="velo-submit-button"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : isRegistering
                    ? "Create my account"
                    : "Sign in to VELOOP"}
                {!loading && <span>→</span>}
              </button>
            </form>

            <div className="velo-form-footer">
              <div className="velo-security">
                <span>◆</span>
                Secure account authentication
              </div>

              <p>
                {isRegistering
                  ? "Already have an account?"
                  : "New to VELOOP?"}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError("");
                    setSuccess("");
                    setPassword("");
                    setName("");
                  }}
                >
                  {isRegistering ? " Sign in" : " Create account"}
                </button>
              </p>
            </div>
          </div>

          <p className="velo-copyright">
            © 2026 VELOOP REWARDS. ALL RIGHTS RESERVED.
          </p>
        </div>
      </section>
    </main>
  );
}

export default App;
