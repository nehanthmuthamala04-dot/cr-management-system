import AttendanceLeaderboard from "../components/AttendanceLeaderboard";
import HolidayManager from "../components/HolidayManager";
import NavBar from "../components/NavBar";
import { useState } from "react";

export default function Leaderboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <NavBar />
      <main className="page leaderboard-page">
        <section className="page-header">
          <div>
            <p className="eyebrow">Performance</p>
            <h1>Attendance Leaderboard</h1>
            <p className="muted">Track monthly attendance performance and top students.</p>
          </div>
        </section>
        <div className="leaderboard-page-grid">
          <AttendanceLeaderboard refreshKey={refreshKey} />
          <HolidayManager onChange={() => setRefreshKey((key) => key + 1)} />
        </div>
      </main>
    </>
  );
}
