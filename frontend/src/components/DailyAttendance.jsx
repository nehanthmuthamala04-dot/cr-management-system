import { BookOpen, Clock, MapPin, Plus, QrCode, Trash2, UserCheck, UserMinus } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { endpoints } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { localDateValue } from "../utils";

export default function DailyAttendance({ refreshDashboard, classFilter }) {
  const { user } = useAuth();
  const canManage = ["admin", "cr"].includes(user?.role);
  const today = localDateValue();
  const [attendanceDate, setAttendanceDate] = useState(today);
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("General");
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState("");
  const [reminders, setReminders] = useState(false);
  const [locationReady, setLocationReady] = useState(false);

  async function load() {
    if (!canManage) return;
    setLoading(true);
    try {
      const { data } = await endpoints.dailyAttendance(attendanceDate, subject);
      setSheet(data);
    } catch (error) {
      toast.error("Unable to load daily attendance");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [canManage, subject, attendanceDate]);

  useEffect(() => {
    if (!canManage) return;
    endpoints.subjects()
      .then(({ data }) => {
        setSubjects(data);
        if (data.length && !data.some((item) => item.name === subject)) setSubject(data[0].name);
      })
      .catch(() => toast.error("Unable to load subjects"));
  }, [canManage]);

  async function addSubject(event) {
    event.preventDefault();
    const name = newSubject.trim();
    if (!name) return;
    try {
      const { data } = await endpoints.addSubject({ name });
      setSubjects((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)));
      setSubject(data.name);
      setNewSubject("");
      toast.success(`${data.name} added`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to add subject");
    }
  }

  async function removeSubject(item) {
    try {
      await endpoints.deleteSubject(item._id);
      const remaining = subjects.filter((entry) => entry._id !== item._id);
      setSubjects(remaining);
      if (subject === item.name) setSubject(remaining[0]?.name || "General");
      toast.success(`${item.name} removed`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to remove subject");
    }
  }

  async function mark(student, status) {
    try {
      await endpoints.markAttendance({ userId: student.id, status, date: attendanceDate, subject });
      toast.success(`${student.name} marked ${status} for ${subject}`);
      await load();
      refreshDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to mark attendance");
    }
  }

  if (!canManage) return null;

  const visibleStudents = (sheet?.students || []).filter((student) =>
    Object.entries(classFilter || {}).every(([key, value]) => !value || student[key] === value),
  );
  const visiblePresent = visibleStudents.filter((student) => student.dailyStatus === "Present").length;
  const visibleAbsent = visibleStudents.filter((student) => student.dailyStatus === "Absent").length;
  const visibleLate = visibleStudents.filter((student) => student.dailyStatus === "Late").length;
  const visibleNotMarked = visibleStudents.length - visiblePresent - visibleAbsent - visibleLate;

  return (
    <section className="panel daily-panel">
      <div className="section-title">
        <div>
          <p className="eyebrow">Live Daily Attendance</p>
          <h2>Today's Sheet</h2>
        </div>
        <span>{attendanceDate === today ? "Today" : attendanceDate}</span>
      </div>

      {loading ? (
        <div className="screen-loader">Loading daily sheet...</div>
      ) : (
        <>
          <div className="live-grid">
            <span>Total<strong>{visibleStudents.length}</strong></span>
            <span className="present">Present<strong>{visiblePresent}</strong></span>
            <span className="absent">Absent<strong>{visibleAbsent}</strong></span>
            <span>Late<strong>{visibleLate}</strong></span>
            <span>Not Marked<strong>{visibleNotMarked}</strong></span>
          </div>

          <div className="attendance-tools">
            <label className="date-field">
              Date
              <input
                type="date"
                max={today}
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
            </label>
            <label className="select-field">
              Subject
              <select aria-label="Attendance subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
                {subjects.map((item) => <option key={item._id} value={item.name}>{item.name}</option>)}
              </select>
            </label>
            <button className="secondary" type="button" onClick={() => toast.success("QR attendance mode ready for class scan")}>
              <QrCode size={17} />QR Attendance
            </button>
            <button
              className="secondary"
              type="button"
              onClick={() => {
                if (!navigator.geolocation) {
                  toast.error("Location is not available in this browser");
                  return;
                }
                navigator.geolocation.getCurrentPosition(
                  () => {
                    setLocationReady(true);
                    toast.success("Location verified");
                  },
                  () => toast.error("Location permission denied"),
                );
              }}
            >
              <MapPin size={17} />{locationReady ? "Location Ready" : "Verify Location"}
            </button>
            <label className="toggle-line">
              <input type="checkbox" checked={reminders} onChange={(e) => setReminders(e.target.checked)} />
              Automatic reminders
            </label>
          </div>

          <div className="subject-manager">
            <div className="subject-manager-title">
              <BookOpen size={18} />
              <div>
                <strong>Manage Subjects</strong>
                <small>Add subjects, then select one above to take subject-wise attendance.</small>
              </div>
            </div>
            <form className="subject-add-form" onSubmit={addSubject}>
              <input
                aria-label="New subject name"
                placeholder="New subject name"
                maxLength={80}
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
              <button type="submit" disabled={!newSubject.trim()}><Plus size={17} />Add Subject</button>
            </form>
            <div className="subject-chips">
              {subjects.map((item) => (
                <span className={item.name === subject ? "selected" : ""} key={item._id}>
                  <button className="subject-name" type="button" onClick={() => setSubject(item.name)}>{item.name}</button>
                  {item.name !== "General" && (
                    <button className="subject-delete" type="button" title={`Delete ${item.name}`} onClick={() => removeSubject(item)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="daily-list">
            {visibleStudents.length === 0 ? (
              <p className="empty">No students found for this class filter.</p>
            ) : visibleStudents.map((student) => (
              <div className="daily-row" key={student.id}>
                <img src={student.photo || "/avatar.svg"} alt="" />
                <div>
                  <strong>{student.name}</strong>
                  <small>Roll No: {student.rollNumber}</small>
                </div>
                <span className={student.dailyStatus === "Present" ? "present" : student.dailyStatus === "Absent" ? "absent" : student.dailyStatus === "Late" ? "late" : ""}>
                  {student.dailyStatus}
                </span>
                <div className="row-actions">
                  <button title="Mark present" onClick={() => mark(student, "Present")}><UserCheck size={17} /></button>
                  <button className="secondary" title="Mark absent" onClick={() => mark(student, "Absent")}><UserMinus size={17} /></button>
                  <button className="secondary" title="Mark late" onClick={() => mark(student, "Late")}><Clock size={17} /></button>
                </div>
              </div>
            ))}
          </div>

          <p className="approval-note">
            Showing {subject} attendance for {attendanceDate}. Choose an earlier date to review or update previous-day status.
          </p>
        </>
      )}
    </section>
  );
}
