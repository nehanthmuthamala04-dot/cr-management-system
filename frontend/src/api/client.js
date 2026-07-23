import axios from "axios";

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
  devLogin: () => api.post("/auth/dev-login"),
  me: () => api.get("/auth/me"),
  group: () => api.get("/groups/class"),
  loginAttendance: () => api.post("/attendance/login"),
  logoutAttendance: () => api.post("/attendance/logout"),
  myAttendance: () => api.get("/attendance/me"),
  ranking: () => api.get("/attendance/ranking"),
  leaderboard: (month) => api.get("/attendance/leaderboard", { params: month ? { month } : {} }),
  attendanceReport: (month) => api.get("/attendance/report", { params: month ? { month } : {} }),
  holidays: () => api.get("/attendance/holidays"),
  addHoliday: (data) => api.post("/attendance/holidays", data),
  deleteHoliday: (date) => api.delete(`/attendance/holidays/${date}`),
  subjects: () => api.get("/attendance/subjects"),
  addSubject: (data) => api.post("/attendance/subjects", data),
  deleteSubject: (id) => api.delete(`/attendance/subjects/${id}`),
  dailyAttendance: (date, subject) => api.get("/attendance/daily", {
    params: {
      ...(date ? { day: date } : {}),
      ...(subject ? { subject } : {}),
    },
  }),
  markAttendance: (data) => api.post("/attendance/mark", data),
  updateGroup: (data) => api.put("/groups/class", data),
  addStudent: (data) => api.post("/students", data),
  updateStudent: (id, data) => api.put(`/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/students/${id}`),
  announcements: () => api.get("/announcements"),
  createAnnouncement: (data) => api.post("/announcements", data),
  updateAnnouncement: (id, data) => api.put(`/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}`),
  profile: () => api.get("/profile"),
  updateProfile: (data) => api.put("/profile", data),
};
