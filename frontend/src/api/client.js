import axios from "axios";

const hostedDemo = window.location.hostname.endsWith(".github.io");
const demoUser = {
  _id: "dev_test_user",
  id: "dev_test_user",
  googleId: "dev_test_user",
  name: "Test CR",
  email: "test@example.com",
  role: "cr",
  photo: null,
  attendancePercentage: 100,
  totalDaysPresent: 1,
  totalDaysAbsent: 0,
  monthlyPercentage: 100,
};
let demoStudents = [
  { ...demoUser, rollNumber: "DS001", department: "Data Science", year: "3rd Year", semester: "3-1", section: "A" },
];
let demoAnnouncements = [
  { id: "demo-1", _id: "demo-1", title: "Welcome", message: "GitHub Pages demo mode is ready.", createdAt: new Date().toISOString() },
];
let demoSubjects = [
  { _id: "subject_general", name: "General" },
  { _id: "subject_dbms", name: "DBMS" },
  { _id: "subject_data_science", name: "Data Science" },
];
const demoResponse = (data) => Promise.resolve({ data });
const demoDaily = (date, subject) => ({
  date: date || new Date().toISOString().slice(0, 10),
  subject: subject || "General",
  total: demoStudents.length,
  present: demoStudents.length,
  absent: 0,
  late: 0,
  notMarked: 0,
  students: demoStudents.map((student) => ({ ...student, dailyStatus: "Present", dailyRecord: null })),
});

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cr_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const endpoints = {
  googleLogin: (credential) => api.post("/auth/google", { credential }),
  devLogin: () => hostedDemo
    ? demoResponse({ accessToken: "github-pages-demo", user: demoUser })
    : api.post("/auth/dev-login"),
  me: () => hostedDemo ? demoResponse(demoUser) : api.get("/auth/me"),
  group: () => hostedDemo ? demoResponse({
    _id: "ds_3_1", groupName: "DS 3-1 Semester Group", academicYear: "2026-2027",
    department: "Data Science", year: "3rd Year", semester: "3-1", section: "A",
    crName: "Test CR", facultyCoordinator: "Faculty Coordinator", joinCode: "DS31-CR",
    totalStudents: demoStudents.length,
  }) : api.get("/groups/class"),
  loginAttendance: () => hostedDemo ? demoResponse({ status: "Present" }) : api.post("/attendance/login"),
  logoutAttendance: () => hostedDemo ? demoResponse({ status: "Present" }) : api.post("/attendance/logout"),
  myAttendance: () => hostedDemo ? demoResponse([]) : api.get("/attendance/me"),
  ranking: () => hostedDemo ? demoResponse(demoStudents) : api.get("/attendance/ranking"),
  leaderboard: (month) => hostedDemo
    ? demoResponse({ month: month || new Date().toISOString().slice(0, 7), students: demoStudents })
    : api.get("/attendance/leaderboard", { params: month ? { month } : {} }),
  attendanceReport: (month) => hostedDemo
    ? demoResponse({ month: month || new Date().toISOString().slice(0, 7), students: demoStudents, classPercentage: 100, lowAttendanceStudents: [], subjectSummary: [] })
    : api.get("/attendance/report", { params: month ? { month } : {} }),
  holidays: () => hostedDemo ? demoResponse([]) : api.get("/attendance/holidays"),
  addHoliday: (data) => hostedDemo ? demoResponse(data) : api.post("/attendance/holidays", data),
  deleteHoliday: (date) => hostedDemo ? demoResponse({ deleted: true, date }) : api.delete(`/attendance/holidays/${date}`),
  subjects: () => hostedDemo ? demoResponse(demoSubjects) : api.get("/attendance/subjects"),
  addSubject: (data) => {
    if (!hostedDemo) return api.post("/attendance/subjects", data);
    const subject = { _id: `subject_${Date.now()}`, name: data.name };
    demoSubjects = [...demoSubjects, subject];
    return demoResponse(subject);
  },
  deleteSubject: (id) => {
    if (!hostedDemo) return api.delete(`/attendance/subjects/${id}`);
    demoSubjects = demoSubjects.filter((subject) => subject._id !== id);
    return demoResponse({ deleted: true });
  },
  dailyAttendance: (date, subject) => hostedDemo ? demoResponse(demoDaily(date, subject)) : api.get("/attendance/daily", {
    params: {
      ...(date ? { day: date } : {}),
      ...(subject ? { subject } : {}),
    },
  }),
  markAttendance: (data) => hostedDemo ? demoResponse(data) : api.post("/attendance/mark", data),
  updateGroup: (data) => hostedDemo ? demoResponse(data) : api.put("/groups/class", data),
  addStudent: (data) => {
    if (!hostedDemo) return api.post("/students", data);
    const student = { ...data, id: `demo-${Date.now()}`, _id: `demo-${Date.now()}`, role: "student", attendancePercentage: 0 };
    demoStudents = [...demoStudents, student];
    return demoResponse(student);
  },
  updateStudent: (id, data) => {
    if (!hostedDemo) return api.put(`/students/${id}`, data);
    demoStudents = demoStudents.map((student) => student.id === id ? { ...student, ...data } : student);
    return demoResponse(demoStudents.find((student) => student.id === id));
  },
  deleteStudent: (id) => {
    if (!hostedDemo) return api.delete(`/students/${id}`);
    demoStudents = demoStudents.filter((student) => student.id !== id);
    return demoResponse({ deleted: true });
  },
  announcements: () => hostedDemo ? demoResponse(demoAnnouncements) : api.get("/announcements"),
  createAnnouncement: (data) => {
    if (!hostedDemo) return api.post("/announcements", data);
    const item = { ...data, id: `demo-${Date.now()}`, _id: `demo-${Date.now()}`, createdAt: new Date().toISOString() };
    demoAnnouncements = [item, ...demoAnnouncements];
    return demoResponse(item);
  },
  updateAnnouncement: (id, data) => {
    if (!hostedDemo) return api.put(`/announcements/${id}`, data);
    demoAnnouncements = demoAnnouncements.map((item) => item._id === id ? { ...item, ...data } : item);
    return demoResponse(demoAnnouncements.find((item) => item._id === id));
  },
  deleteAnnouncement: (id) => {
    if (!hostedDemo) return api.delete(`/announcements/${id}`);
    demoAnnouncements = demoAnnouncements.filter((item) => item._id !== id);
    return demoResponse({ deleted: true });
  },
  profile: () => hostedDemo ? demoResponse(demoUser) : api.get("/profile"),
  updateProfile: (data) => hostedDemo ? demoResponse({ ...demoUser, ...data }) : api.put("/profile", data),
};
