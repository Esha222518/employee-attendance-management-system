import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    department: "",
    designation: "",
    employeeId: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register(form);
      navigate(user.role === "hr" ? "/hr" : "/employee");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create account</h1>
        <p className="sub">Register as an employee or HR</p>
        {error && <div className="error-box">{error}</div>}
        <div className="field">
          <label>Full Name</label>
          <input name="name" required value={form.name} onChange={handleChange} />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" name="email" required value={form.email} onChange={handleChange} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" name="password" required minLength={6} value={form.password} onChange={handleChange} />
        </div>
        <div className="field">
          <label>Role</label>
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="employee">Employee</option>
            <option value="hr">HR</option>
          </select>
        </div>
        <div className="field">
          <label>Department</label>
          <input name="department" value={form.department} onChange={handleChange} placeholder="e.g. Engineering" />
        </div>
        <div className="field">
          <label>Employee ID</label>
          <input name="employeeId" value={form.employeeId} onChange={handleChange} placeholder="e.g. EMP003" />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>
        <p className="sub" style={{ marginTop: 16, textAlign: "center" }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
