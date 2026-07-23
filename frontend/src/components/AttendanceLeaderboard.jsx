import { CalendarDays, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { endpoints } from "../api/client";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function AttendanceLeaderboard({ refreshKey = 0 }) {
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ workingDays: 0, holidays: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    endpoints
      .leaderboard(month)
      .then(({ data }) => {
        setRows(data.students);
        setSummary({ workingDays: data.workingDays, holidays: data.holidays });
      })
      .catch(() => toast.error("Unable to load leaderboard"))
      .finally(() => setLoading(false));
  }, [month, refreshKey]);

  return (
    <section className="panel leaderboard-panel">
      <div className="section-title">
        <div>
          <p className="eyebrow">Monthly Attendance</p>
          <h2>Leaderboard</h2>
        </div>
        <label className="date-field">
          <CalendarDays size={17} />
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </label>
      </div>

      {loading ? (
        <div className="screen-loader">Loading leaderboard...</div>
      ) : rows.length === 0 ? (
        <>
          <div className="calculator-grid">
            <span>Working Days<strong>{summary.workingDays}</strong></span>
            <span>Holidays<strong>{summary.holidays}</strong></span>
            <span>Formula<strong>Present / Working Days</strong></span>
          </div>
          <p className="empty">No students added yet.</p>
        </>
      ) : (
        <>
          <div className="calculator-grid">
            <span>Working Days<strong>{summary.workingDays}</strong></span>
            <span>Holidays<strong>{summary.holidays}</strong></span>
            <span>Formula<strong>Present / Working Days</strong></span>
          </div>
          <div className="leaderboard-list">
            {rows.map((student) => (
              <div className={student.rank <= 3 ? "leader-row top-rank" : "leader-row"} key={student.id}>
                <span className="rank-badge">{student.rank <= 3 ? <Trophy size={17} /> : student.rank}</span>
                <img src={student.photo || "/avatar.svg"} alt="" />
                <div>
                  <strong>{student.name}</strong>
                  <small>
                    Roll No: {student.rollNumber} - {student.monthlyPresent} present,
                    {student.monthlyAbsent} absent, {student.monthlyNotMarked} not marked
                  </small>
                </div>
                <span className="leader-score">{student.monthlyPercentage}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
