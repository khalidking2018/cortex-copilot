import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [tenant, setTenant] = useState(localStorage.getItem("tenant") || "");

  const handleLogin = (newToken, newTenant) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("tenant", newTenant);
    setToken(newToken);
    setTenant(newTenant);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tenant");
    setToken("");
    setTenant("");
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard token={token} tenant={tenant} onLogout={handleLogout} />;
}

export default App;
