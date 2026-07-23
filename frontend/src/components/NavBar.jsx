import { Bell, LayoutDashboard, LogOut, Trophy, UserRound, ClipboardCheck, Users, UserPlus } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function NavBar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="top-nav">
      <NavLink className="brand" to="/dashboard"><span>CR</span> Management</NavLink>
      <div className="nav-links">
        <NavLink to="/dashboard"><LayoutDashboard size={18} />Dashboard</NavLink>
        <NavLink to="/group"><Users size={18} />Class Group</NavLink>
        <NavLink to="/students"><UserPlus size={18} />Students</NavLink>
        <NavLink to="/attendance"><ClipboardCheck size={18} />Attendance</NavLink>
        <NavLink to="/leaderboard"><Trophy size={18} />Leaderboard</NavLink>
        <NavLink to="/announcements"><Bell size={18} />Announcements</NavLink>
        <NavLink to="/profile"><UserRound size={18} />Profile</NavLink>
      </div>
      <div className="nav-user">
        <img src={user?.photo || "/avatar.svg"} alt="" />
        <button
          className="icon-text"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </nav>
  );
}
