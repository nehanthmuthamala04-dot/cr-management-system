import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login, devLogin } = useAuth();
  const navigate = useNavigate();

  const handleDevLogin = async () => {
    try {
      await devLogin();
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Development login failed");
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="eyebrow">DS 3-1 Semester Group</p>
        <h1>CR Management</h1>
        <p className="muted">Sign in with your Google account to view attendance, announcements, and your class profile.</p>
        <GoogleLogin
          onSuccess={async ({ credential }) => {
            try {
              await login(credential);
              navigate("/dashboard");
            } catch (error) {
              toast.error(error.response?.data?.detail || "Google OAuth is not ready. Use Dev Login.");
            }
          }}
          onError={() => toast.error("Google OAuth is not ready. Use Dev Login.")}
        />
        <div className="login-actions">
          <button className="dev-login-button" onClick={handleDevLogin}>
            Continue with Dev Login
          </button>
        </div>
      </section>
    </main>
  );
}
