
import { useState } from "react";
import API from "./api/api";
import Dashboard from "./Dashboard";
import "./App.css";
import AdminDashboard from "./AdminDashboard";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", {
        email,
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
        err.response?.data?.message || "Unable to login"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await API.post("/auth/register", {
        name,
        email,
        password
      });

      setIsRegistering(false);
      setName("");
      setEmail("");
      setPassword("");
      setError("Registration successful! Please log in.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to register"
      );
    } finally {
      setLoading(false);
    }
  };

  if (isLoggedIn) {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user?.role === "ADMIN") {
      return <AdminDashboard />;
    }

    return <Dashboard />;
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Daily Streak</h2>

        <p>
          {isRegistering
            ? "Create your account to start earning rewards"
            : "Login to access your rewards"}
        </p>

        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          {isRegistering && (
            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          <button
            className="btn btn-primary w-100"
            type="submit"
            disabled={loading}
          >
            {loading
              ? isRegistering
                ? "Creating account..."
                : "Logging in..."
              : isRegistering
                ? "Register"
                : "Login"}
          </button>
        </form>

        <button
          type="button"
          className="btn btn-outline-primary w-100 mt-3"
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError("");
            setName("");
            setEmail("");
            setPassword("");
          }}
        >
          {isRegistering
            ? "Already have an account? Login"
            : "New user? Create Account"}
        </button>
      </div>
    </div>
  );
}

export default App;
