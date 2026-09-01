import { useEffect, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [tab, setTab] = useState("attendance");
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [leaveForm, setLeaveForm] = useState({ startDate: "", endDate: "", reason: "" });

  const loadAll = async () => {
    const [dashRes, attRes, leaveRes] = await Promise.all([
      api.get("/dashboard/employee"),
      api.get("/attendance/me"),
      api.get("/leave/me"),
    ]);
    setSummary(dashRes.data);
    setRecords(attRes.data.records);
    setLeaves(leaveRes.data.leaves);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setMsg("");
    try {
      await api.post("/attendance/checkin");
      setMsg("Checked in successfully!");
      await loadAll();
    } catch (err) {
      setMsg(err.response?.data?.message || "Check-in failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setMsg("");
    try {
      await api.post("/attendance/checkout");
      setMsg("Checked out successfully!");
      await loadAll();
    } catch (err) {
      setMsg(err.response?.data?.message || "Check-out failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMsg("");
    try {
      await api.post("/leave/apply", leaveForm);
      setLeaveForm({ startDate: "", endDate: "", reason: "" });
      setMsg("Leave request submitted!");
      await loadAll();
    } catch (err) {
      setMsg(err.response?.data?.message || "Leave request failed");
    } finally {
      setActionLoading(false);
    }
  };

  const today = summary?.today;
  const canCheckIn = !today || !today.checkIn;
  const canCheckOut = today && today.checkIn && !today.checkOut;

  return (
    <div>
      <Navbar />
      <div className="container">
        <h2>Hi, {user.name.split(" ")[0]} 👋</h2>
        <p className="muted">{user.department} · {user.designation}</p>

        <div className="grid grid-4 mt-16">
          <div className="card stat-card">
            <div className="label">Today</div>
            <div className="value" style={{ fontSize: 16 }}>
              <StatusBadge status={today?.status || "Not checked in"} />
            </div>
          </div>
          <div className="card stat-card">
            <div className="label">This Month Hours</div>
            <div className="value">{summary?.monthSummary?.totalHours ?? 0}</div>
          </div>
          <div className="card stat-card">
            <div className="label">Present Days</div>
            <div className="value">{summary?.monthSummary?.presentDays ?? 0}</div>
          </div>
          <div className="card stat-card">
            <div className="label">Pending Leaves</div>
            <div className="value">{summary?.pendingLeaves ?? 0}</div>
          </div>
        </div>

        <div className="card mt-16">
          <div className="row-between">
            <div>
              <strong>Check-In / Check-Out</strong>
              <div className="muted">
                {today?.checkIn ? `In: ${new Date(today.checkIn).toLocaleTimeString()}` : "Not checked in yet"}
                {today?.checkOut ? ` · Out: ${new Date(today.checkOut).toLocaleTimeString()}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-success" disabled={!canCheckIn || actionLoading} onClick={handleCheckIn}>
                Check In
              </button>
              <button className="btn btn-danger" disabled={!canCheckOut || actionLoading} onClick={handleCheckOut}>
                Check Out
              </button>
            </div>
          </div>
          {msg && <p className="mt-16 muted">{msg}</p>}
        </div>

        <div className="tabs mt-16">
          <div className={`tab ${tab === "attendance" ? "active" : ""}`} onClick={() => setTab("attendance")}>
            Attendance History
          </div>
          <div className={`tab ${tab === "leave" ? "active" : ""}`} onClick={() => setTab("leave")}>
            Apply for Leave
          </div>
          <div className={`tab ${tab === "leaveHistory" ? "active" : ""}`} onClick={() => setTab("leaveHistory")}>
            Leave History
          </div>
        </div>

        {tab === "attendance" && (
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id}>
                    <td>{r.date}</td>
                    <td>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : "-"}</td>
                    <td>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "-"}</td>
                    <td>{r.workingHours || 0}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr><td colSpan={5} className="muted">No attendance records yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "leave" && (
          <div className="card" style={{ maxWidth: 460 }}>
            <form onSubmit={handleLeaveSubmit}>
              <div className="field">
                <label>Start Date</label>
                <input type="date" required value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} />
              </div>
              <div className="field">
                <label>End Date</label>
                <input type="date" required value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} />
              </div>
              <div className="field">
                <label>Reason</label>
                <textarea required rows={3} value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
              </div>
              <button className="btn btn-primary" disabled={actionLoading}>Submit Request</button>
            </form>
          </div>
        )}

        {tab === "leaveHistory" && (
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l._id}>
                    <td>{l.startDate}</td>
                    <td>{l.endDate}</td>
                    <td>{l.days}</td>
                    <td>{l.reason}</td>
                    <td><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
                {leaves.length === 0 && (
                  <tr><td colSpan={5} className="muted">No leave requests yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
