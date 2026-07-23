import { Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { endpoints } from "../api/client";
import AttendanceHistory from "../components/AttendanceHistory";
import AttendancePanel from "../components/AttendancePanel";
import DailyAttendance from "../components/DailyAttendance";
import NavBar from "../components/NavBar";
import { todayRecord } from "../utils";

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [report, setReport] = useState(null);
  const [students, setStudents] = useState([]);
  const [classFilter, setClassFilter] = useState({ department: "", year: "", semester: "", section: "" });
  const [subjectFilter, setSubjectFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [historyRes, reportRes, rankingRes] = await Promise.all([
        endpoints.myAttendance(),
        endpoints.attendanceReport(),
        endpoints.ranking(),
      ]);
      setRecords(historyRes.data);
      setReport(reportRes.data);
      setStudents(rankingRes.data);
    } catch (error) {
      toast.error("Unable to load attendance");
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredReport = report ? filterAttendanceReport(report, classFilter, subjectFilter) : null;

  function downloadReport() {
    const rows = [
      ["Roll Number", "Name", "Department", "Year", "Semester", "Section", "Present", "Absent", "Late", "Percentage"],
      ...(filteredReport?.students || []).map((student) => [
        student.rollNumber,
        student.name,
        student.department,
        student.year,
        student.semester,
        student.section,
        student.monthlyPresent,
        student.monthlyAbsent,
        student.monthlyLate,
        student.monthlyPercentage,
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-report-${report?.month || "current"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    load();
  }, [load]);

  const filterOptions = (key) => [...new Set(students.map((student) => student[key]).filter(Boolean))].sort();

  return (
    <>
      <NavBar />
      <main className="page attendance-page">
        <section className="page-header">
          <div>
            <p className="eyebrow">Daily Register</p>
            <h1>Attendance Taking</h1>
            <p className="muted">Mark today&apos;s status and review today&apos;s attendance only.</p>
          </div>
        </section>
        {loading ? (
          <div className="screen-loader">Loading attendance...</div>
        ) : (
          <div className="attendance-page-grid">
            <div className="main-column">
              <section className="panel class-filter-panel">
                <div className="section-title">
                  <div>
                    <p className="eyebrow">Class-wise Attendance</p>
                    <h2>Select Class</h2>
                  </div>
                  <span>{filteredReport?.students.length ?? 0} students</span>
                </div>
                <div className="class-filter-grid">
                  {["department", "year", "semester", "section"].map((key) => (
                    <select key={key} value={classFilter[key]} onChange={(e) => setClassFilter({ ...classFilter, [key]: e.target.value })}>
                      <option value="">All {key}</option>
                      {filterOptions(key).map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  ))}
                  <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                    <option value="">All subjects</option>
                    {[...new Set((report?.subjectSummary || []).map((subject) => subject.subject))].map((subject) => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              </section>
              <DailyAttendance refreshDashboard={load} classFilter={classFilter} />
              {filteredReport && <ClassAttendanceReport report={filteredReport} downloadReport={downloadReport} />}
              <AttendancePanel today={todayRecord(records)} refresh={load} />
            </div>
            <AttendanceHistory records={records} />
          </div>
        )}
      </main>
    </>
  );
}

function matchesClass(student, filter) {
  return Object.entries(filter).every(([key, value]) => !value || student[key] === value);
}

function filterAttendanceReport(report, filter, subjectFilter) {
  const students = (report.students || []).filter((student) => matchesClass(student, filter));
  const lowAttendanceStudents = students.filter((student) => student.monthlyPercentage < 75);
  const classPercentage = students.length
    ? Math.round((students.reduce((total, student) => total + student.monthlyPercentage, 0) / students.length) * 100) / 100
    : 0;
  const subjectSummary = (report.subjectSummary || []).filter((subject) => !subjectFilter || subject.subject === subjectFilter);
  return { ...report, students, lowAttendanceStudents, classPercentage, subjectSummary, selectedSubject: subjectFilter };
}

function ClassAttendanceReport({ report, downloadReport }) {
  return (
    <section className="panel report-panel">
      <div className="section-title">
        <div>
          <p className="eyebrow">Class Report</p>
          <h2>Attendance Overview</h2>
        </div>
        <button onClick={downloadReport}><Download size={18} />Download Report</button>
      </div>
      <div className="live-grid">
        <span>Class Percentage<strong>{report.classPercentage}%</strong></span>
        <span>Working Days<strong>{report.workingDays}</strong></span>
        <span>Low Attendance<strong>{report.lowAttendanceStudents.length}</strong></span>
        <span>Subjects<strong>{report.subjectSummary.length}</strong></span>
      </div>
      <div className="report-grid">
        <div>
          <h3>Subject-wise Attendance</h3>
          {(report.subjectSummary.length ? report.subjectSummary : [{ subject: "General", present: 0, absent: 0, late: 0 }]).map((subject) => (
            <div className="report-row" key={subject.subject}>
              <strong>{subject.subject}</strong>
              <span>Present {subject.present} / Absent {subject.absent} / Late {subject.late}</span>
              <span>{subject.total ? Math.round((subject.present / subject.total) * 100) : 0}% attendance</span>
            </div>
          ))}
        </div>
        <div>
          <h3>Low-attendance Students</h3>
          {report.lowAttendanceStudents.length === 0 ? (
            <p className="empty">No students below 75%.</p>
          ) : report.lowAttendanceStudents.slice(0, 6).map((student) => (
            <div className="report-row" key={student.id}>
              <strong>{student.name}</strong>
              <span>{student.rollNumber} - {student.monthlyPercentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
