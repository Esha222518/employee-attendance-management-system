import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === "hr" ? "/hr" : "/employee");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Welcome back</h1>
        <p className="sub">Sign in to your attendance account</p>
        {error && <div className="error-box">{error}</div>}
        <div className="field">
          <label>Email</label>
          <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="you@company.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" name="password" required value={form.password} onChange={handleChange} placeholder="••••••••" />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <p className="sub" style={{ marginTop: 16, textAlign: "center" }}>
          No account? <Link to="/register">Register here</Link>
        </p>
        <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>
          Demo: hr@company.com / password123 (HR) · john@company.com / password123 (Employee)
        </p>
      </form>
    </div>
  );
};

export default Login;
