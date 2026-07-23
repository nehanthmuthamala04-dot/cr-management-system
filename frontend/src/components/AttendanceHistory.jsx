import { formatDateTime, minutesLabel } from "../utils";

export default function AttendanceHistory({ records }) {
  return (
    <aside className="panel history-panel">
      <div className="section-title">
        <h2>My Attendance History</h2>
        <span>{records.length}</span>
      </div>
      {records.length === 0 ? (
        <p className="empty">No attendance records yet.</p>
      ) : (
        <div className="history-list">
          {records.map((record) => (
            <div className="history-item" key={record._id}>
              <strong>{record.date}</strong>
              <span>Login: {formatDateTime(record.loginTime)}</span>
              <span>Logout: {formatDateTime(record.logoutTime)}</span>
              <span>{minutesLabel(record.duration)} - {record.status}</span>
              <span>{record.subject || "General"} - {record.approvalStatus || "Approved"}</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
