const map = {
  Present: "badge-present",
  Late: "badge-late",
  "Half Day": "badge-halfday",
  Absent: "badge-absent",
  "On Leave": "badge-leave",
  Pending: "badge-pending",
  Approved: "badge-approved",
  Rejected: "badge-rejected",
};

const StatusBadge = ({ status }) => (
  <span className={`badge ${map[status] || "badge-present"}`}>{status}</span>
);

export default StatusBadge;
