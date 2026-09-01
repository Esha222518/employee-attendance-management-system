import { useEffect, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";

const HRDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [tab, setTab] = useState("overview");
  const [msg, setMsg] = useState("");
  const [deductionEmployee, setDeductionEmployee] = useState("");
  const [deductionMonth, setDeductionMonth] = useState(new Date().toISOString().slice(0, 7));
  const [deductionResult, setDeductionResult] = useState(null);

  const loadAll = async () => {
    const [dashRes, empRes, attRes, leaveRes] = await Promise.all([
      api.get("/dashboard/hr"),
      api.get("/dashboard/employees"),
      api.get("/attendance/all"),
      api.get("/leave/all"),
    ]);
    setSummary(dashRes.data);
    setEmployees(empRes.data.employees);
    setAttendance(attRes.data.records);
    setLeaves(leaveRes.data.leaves);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const reviewLeave = async (id, status) => {
    setMsg("");
    try {
      await api.put(`/leave/${id}/review`, { status });
      setMsg(`Leave ${status.toLowerCase()}.`);
      await loadAll();
    } catch (err) {
      setMsg(err.response?.data?.message || "Action failed");
    }
  };

  const checkDeduction = async (e) => {
    e.preventDefault();
    if (!deductionEmployee || !deductionMonth) return;
    try {
      const res = await api.get(`/leave/deduction/${deductionEmployee}`, { params: { month: deductionMonth } });
      setDeductionResult(res.data);
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not compute deduction");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <h2>HR Dashboard</h2>

        <div className="grid grid-4 mt-16">
          <div className="card stat-card">
            <div className="label">Total Employees</div>
            <div className="value">{summary?.totalEmployees ?? 0}</div>
          </div>
          <div className="card stat-card">
            <div className="label">Present Today</div>
            <div className="value">{summary?.presentToday ?? 0}</div>
          </div>
          <div className="card stat-card">
            <div className="label">On Leave Today</div>
            <div className="value">{summary?.onLeaveToday ?? 0}</div>
          </div>
          <div className="card stat-card">
            <div className="label">Pending Leave Requests</div>
            <div className="value">{summary?.pendingLeaves ?? 0}</div>
          </div>
        </div>

        <div className="tabs mt-16">
          <div className={`tab ${tab === "overview" ? "active" : ""}`} onClick={() => setTab("overview")}>Employees</div>
          <div className={`tab ${tab === "attendance" ? "active" : ""}`} onClick={() => setTab("attendance")}>Attendance Log</div>
          <div className={`tab ${tab === "leaves" ? "active" : ""}`} onClick={() => setTab("leaves")}>Leave Requests</div>
          <div className={`tab ${tab === "deduction" ? "active" : ""}`} onClick={() => setTab("deduction")}>Leave Deduction</div>
        </div>

        {msg && <p className="muted">{msg}</p>}

        {tab === "overview" && (
          <div className="card">
            <table>
              <thead>
                <tr><th>Employee ID</th><th>Name</th><th>Department</th><th>Designation</th><th>Email</th></tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e._id}>
                    <td>{e.employeeId || "-"}</td>
                    <td>{e.name}</td>
                    <td>{e.department}</td>
                    <td>{e.designation}</td>
                    <td>{e.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "attendance" && (
          <div className="card">
            <table>
              <thead>
                <tr><th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr>
              </thead>
              <tbody>
                {attendance.map((r) => (
                  <tr key={r._id}>
                    <td>{r.employee?.name}</td>
                    <td>{r.date}</td>
                    <td>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : "-"}</td>
                    <td>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "-"}</td>
                    <td>{r.workingHours || 0}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
                {attendance.length === 0 && <tr><td colSpan={6} className="muted">No records yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === "leaves" && (
          <div className="card">
            <table>
              <thead>
                <tr><th>Employee</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l._id}>
                    <td>{l.employee?.name}</td>
                    <td>{l.startDate}</td>
                    <td>{l.endDate}</td>
                    <td>{l.days}</td>
                    <td>{l.reason}</td>
                    <td><StatusBadge status={l.status} /></td>
                    <td>
                      {l.status === "Pending" ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-success" onClick={() => reviewLeave(l._id, "Approved")}>Approve</button>
                          <button className="btn btn-danger" onClick={() => reviewLeave(l._id, "Rejected")}>Reject</button>
                        </div>
                      ) : (
                        <span className="muted">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && <tr><td colSpan={7} className="muted">No leave requests yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === "deduction" && (
          <div className="card" style={{ maxWidth: 480 }}>
            <form onSubmit={checkDeduction}>
              <div className="field">
                <label>Employee</label>
                <select required value={deductionEmployee} onChange={(e) => setDeductionEmployee(e.target.value)}>
                  <option value="">Select employee</option>
                  {employees.map((e) => (
                    <option key={e._id} value={e._id}>{e.name} ({e.employeeId})</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Month</label>
                <input type="month" required value={deductionMonth} onChange={(e) => setDeductionMonth(e.target.value)} />
              </div>
              <button className="btn btn-primary">Calculate Deduction</button>
            </form>

            {deductionResult && (
              <div className="mt-16">
                <p><strong>{deductionResult.employee.name}</strong> — {deductionResult.month}</p>
                <p className="muted">Monthly Salary: ₹{deductionResult.employee.monthlySalary}</p>
                <p className="muted">Approved Leave Days: {deductionResult.approvedDaysInMonth}</p>
                <p className="muted">Unpaid Days: {deductionResult.unpaidDays}</p>
                <p className="muted">Per-Day Rate: ₹{deductionResult.perDayRate}</p>
                <p><strong>Deduction Amount: ₹{deductionResult.deduction}</strong></p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HRDashboard;
