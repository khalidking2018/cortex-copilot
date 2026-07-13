import { useState } from "react";
import { FaBolt, FaLock, FaUser } from "react-icons/fa";
import api from "../services/api";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setLoading(true);

    api.post("/login", { username, password })
      .then((res) => {
        setLoading(false);
        const { token, tenant } = res.data;
        onLogin(token, tenant);
      })
      .catch((err) => {
        setLoading(false);
        console.error("Login failure:", err);
        if (err.response && err.response.data && err.response.data.detail) {
          setError(err.response.data.detail);
        } else {
          setError("Failed to connect to authentication server.");
        }
      });
  };

  return (
    <div className="login-container animate-fade-in">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-icon">
            <FaBolt />
          </div>
          <h1 className="login-title">Cortex Copilot</h1>
          <p className="login-subtitle">Industrial Energy Monitoring Portal</p>
        </div>

        {error && <div className="login-error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <div className="input-with-icon">
              <FaUser className="input-icon" />
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="Enter username (e.g., tenant_a)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-with-icon">
              <FaLock className="input-icon" />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <p>Tenant credentials required. Contact system administrator for access.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
