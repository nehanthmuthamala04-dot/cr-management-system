import { useCallback, useEffect, useState } from "react";
import { Activity, Bell, BookOpen, CalendarCheck, Clock, ClipboardList, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import { endpoints } from "../api/client";
import AnnouncementBanner from "../components/AnnouncementBanner";
import NavBar from "../components/NavBar";
import StudentList from "../components/StudentList";

const upcomingAssignments = [
  { title: "Mini project progress", subject: "Data Science", due: "Tomorrow" },
  { title: "DBMS lab record", subject: "DBMS", due: "Friday" },
  { title: "Operating systems notes", subject: "OS", due: "Next Monday" },
];

const upcomingExaminations = [
  { title: "Operating Systems Internal", meta: "Jul 29 - Seminar Hall" },
  { title: "Data Mining Quiz", meta: "Aug 02 - Lab 2" },
  { title: "DBMS Viva", meta: "Aug 07 - Lab 1" },
];

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [daily, setDaily] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [rankingRes, announcementsRes, dailyRes, leaderboardRes] = await Promise.all([
        endpoints.ranking(),
        endpoints.announcements(),
        endpoints.dailyAttendance(),
        endpoints.leaderboard(),
      ]);
      setStudents(rankingRes.data);
      setAnnouncements(announcementsRes.data);
      setDaily(dailyRes.data);
      setLeaderboard(leaderboardRes.data);
    } catch (error) {
      toast.error("Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalStudents = students.length;
  const presentStudents = daily?.present ?? 0;
  const absentStudents = daily?.absent ?? 0;
  const lateStudents = daily?.late ?? 0;
  const attendedStudents = presentStudents + lateStudents;
  const attendancePercentage = daily?.total ? Math.round((attendedStudents / daily.total) * 100) : 0;
  const topStudents = (leaderboard?.students ?? []).slice(0, 5);
  const pendingTasks = [
    { title: "Complete today's attendance", meta: `${daily?.notMarked ?? 0} students not marked` },
    { title: "Check latest announcements", meta: `${announcements.length} active updates` },
    { title: "Review attendance leaderboard", meta: `${topStudents.length} ranked students` },
  ];
  const recentActivities = [
    { title: `${attendedStudents} students attended`, meta: `${presentStudents} present, ${lateStudents} late` },
    { title: `${absentStudents} students marked absent`, meta: "Today" },
    announcements[0]
      ? { title: `Announcement: ${announcements[0].title}`, meta: "Latest update" }
      : { title: "No announcement activity yet", meta: "Latest update" },
  ];

  return (
    <>
      <NavBar />
      <main className="page dashboard">
        <AnnouncementBanner announcements={announcements} />
        {loading ? (
          <div className="screen-loader">Loading dashboard...</div>
        ) : (
          <div className="dashboard-overview">
            <section className="dashboard-header">
              <div>
                <p className="eyebrow">Control Center</p>
                <h1>Class Operations</h1>
                <p className="muted">Manage student records and monitor today&apos;s attendance status.</p>
              </div>
            </section>
            <div className="overview-grid">
              <span>Total Students<strong>{totalStudents}</strong></span>
              <span className="present">Present Students<strong>{presentStudents}</strong></span>
              <span className="absent">Absent Students<strong>{absentStudents}</strong></span>
              <span className="late">Late Students<strong>{lateStudents}</strong></span>
              <span className="percentage">Attendance Percentage<strong>{attendancePercentage}%</strong></span>
            </div>

            <div className="dashboard-sections">
              <DashboardPanel icon={<Bell size={18} />} title="Latest Announcements">
                {announcements.slice(0, 3).map((announcement) => (
                  <InfoRow key={announcement.id} title={announcement.title} meta={announcement.message} />
                ))}
                {!announcements.length && <p className="empty">No announcements yet.</p>}
              </DashboardPanel>

              <DashboardPanel icon={<BookOpen size={18} />} title="Upcoming Assignments">
                {upcomingAssignments.map((assignment) => (
                  <InfoRow
                    key={assignment.title}
                    title={assignment.title}
                    meta={`${assignment.subject} - ${assignment.due}`}
                  />
                ))}
              </DashboardPanel>

              <DashboardPanel icon={<CalendarCheck size={18} />} title="Upcoming Examinations">
                {upcomingExaminations.map((exam) => (
                  <InfoRow key={exam.title} title={exam.title} meta={exam.meta} />
                ))}
              </DashboardPanel>

              <DashboardPanel icon={<ClipboardList size={18} />} title="Pending Tasks">
                {pendingTasks.map((task) => (
                  <InfoRow key={task.title} title={task.title} meta={task.meta} />
                ))}
              </DashboardPanel>

              <DashboardPanel icon={<Clock size={18} />} title="Today Attendance">
                <InfoRow title="Attended" meta={`${attendedStudents} students including late entries`} />
                <InfoRow title="Absent" meta={`${absentStudents} students`} />
                <InfoRow title="Not Marked" meta={`${daily?.notMarked ?? 0} students`} />
              </DashboardPanel>

              <DashboardPanel icon={<Trophy size={18} />} title="Top Attendance Students">
                {topStudents.map((student, index) => (
                  <InfoRow
                    key={student.id}
                    title={`${index + 1}. ${student.name}`}
                    meta={`Roll No: ${student.rollNumber ?? "Not set"} - ${student.monthlyPercentage ?? 0}%`}
                  />
                ))}
                {!topStudents.length && <p className="empty">Add students to show leaderboard.</p>}
              </DashboardPanel>

              <DashboardPanel icon={<Activity size={18} />} title="Recent Activities">
                {recentActivities.map((activity) => (
                  <InfoRow key={activity.title} title={activity.title} meta={activity.meta} />
                ))}
              </DashboardPanel>
            </div>

            <StudentList students={students} refresh={load} readOnly />
          </div>
        )}
      </main>
    </>
  );
}

function DashboardPanel({ icon, title, children }) {
  return (
    <section className="panel dashboard-card">
      <div className="dashboard-card-title">
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      <div className="dashboard-card-list">{children}</div>
    </section>
  );
}

function InfoRow({ title, meta }) {
  return (
    <div className="dashboard-info-row">
      <strong>{title}</strong>
      <span>{meta}</span>
    </div>
  );
}
