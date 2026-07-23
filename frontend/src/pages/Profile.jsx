import { useEffect, useState } from "react";
import { endpoints } from "../api/client";
import NavBar from "../components/NavBar";

export default function Profile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    endpoints.profile().then(({ data }) => setProfile(data));
  }, []);

  return (
    <>
      <NavBar />
      <main className="page center-page">
        <section className="panel profile-card">
          {!profile ? (
            <p>Loading...</p>
          ) : (
            <>
              <p className="eyebrow">Account</p>
              <img src={profile.photo || "/avatar.svg"} alt="" />
              <h1>{profile.name}</h1>
              <p className="muted">{profile.email}</p>
              <div className="details-grid">
                <span>Attendance<strong>{profile.attendancePercentage}%</strong></span>
                <span>Present<strong>{profile.totalDaysPresent}</strong></span>
                <span>Absent<strong>{profile.totalDaysAbsent}</strong></span>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}
