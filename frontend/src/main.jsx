import { GoogleOAuthProvider } from "@react-oauth/google";
import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import "./styles/App.css";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Students = lazy(() => import("./pages/Students"));
const Profile = lazy(() => import("./pages/Profile"));
const Announcements = lazy(() => import("./pages/Announcements"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="screen-loader">Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <Suspense fallback={<div className="screen-loader">Loading...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Login />} />
            <Route path="/group" element={<PrivateRoute><Landing /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/students" element={<PrivateRoute><Students /></PrivateRoute>} />
            <Route path="/attendance" element={<PrivateRoute><Attendance /></PrivateRoute>} />
            <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
            <Route path="/announcements" element={<PrivateRoute><Announcements /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          </Routes>
        </Suspense>
      </Router>
      <Toaster position="top-right" />
    </AuthProvider>
  </GoogleOAuthProvider>,
);
