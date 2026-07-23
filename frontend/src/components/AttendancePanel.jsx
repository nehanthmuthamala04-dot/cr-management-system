import { LogIn, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { endpoints } from "../api/client";
import { formatDateTime, minutesLabel } from "../utils";

export default function AttendancePanel({ today, refresh }) {
  const status = today?.status || "Absent";

  async function action(kind) {
    try {
      if (kind === "login") await endpoints.loginAttendance();
      else await endpoints.logoutAttendance();
      toast.success(kind === "login" ? "Attendance logged" : "Logout recorded");
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Attendance update failed");
    }
  }

  return (
    <section className="panel attendance-panel">
      <div>
        <p className="eyebrow">Current Status</p>
        <h2 className={status === "Present" ? "present" : status === "Late" ? "late" : "absent"}>{status}</h2>
      </div>
      <div className="attendance-actions">
        <button onClick={() => action("login")}><LogIn size={18} />Login Attendance</button>
        <button className="secondary" onClick={() => action("logout")}><LogOut size={18} />Logout Attendance</button>
      </div>
      <div className="today-grid">
        <span>Login<strong>{formatDateTime(today?.loginTime)}</strong></span>
        <span>Logout<strong>{formatDateTime(today?.logoutTime)}</strong></span>
        <span>Duration<strong>{minutesLabel(today?.duration)}</strong></span>
        <span>Status<strong>{status}</strong></span>
      </div>
    </section>
  );
}
