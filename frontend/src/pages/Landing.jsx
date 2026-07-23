import { ArrowRight, BookOpen, GraduationCap, Hash, Pencil, Save, School, UserCheck, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { endpoints } from "../api/client";
import NavBar from "../components/NavBar";
import { useAuth } from "../contexts/AuthContext";

export default function Landing() {
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultGroup(user?.name));
  const navigate = useNavigate();

  useEffect(() => {
    endpoints.group()
      .then(({ data }) => {
        setGroup(data);
        setForm(toGroupForm(data, user?.name));
      })
      .catch(() => {
        const fallback = defaultGroup(user?.name);
        setGroup(fallback);
        setForm(fallback);
      });
  }, [user?.name]);

  const groupName = group?.groupName || "DS 3-1 Semester Group";
  const department = group?.department || group?.branch || "Data Science";
  const yearSemester = `${group?.year || "3rd Year"} / ${group?.semester || "3-1"}`;
  const crName = group?.crName || user?.name || "Class Representative";

  const joinGroup = () => {
    toast.success(`Joined ${groupName}`);
    navigate("/dashboard");
  };

  const updateField = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const editGroup = () => {
    setForm(toGroupForm(group, user?.name));
    setEditing(true);
  };

  const cancelEdit = () => {
    setForm(toGroupForm(group, user?.name));
    setEditing(false);
  };

  const saveGroup = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await endpoints.updateGroup(form);
      setGroup(data);
      setForm(toGroupForm(data, user?.name));
      setEditing(false);
      toast.success("Group details updated");
    } catch (error) {
      toast.error("Unable to update group details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <NavBar />
      <main className="page group-page">
        <section className="group-hero">
          <div>
            <p className="eyebrow">Class Group</p>
            <h1>{groupName}</h1>
            <p className="muted">
              Manage class members, attendance, announcements, assignments, and exam coordination from one group space.
            </p>
          </div>
          <button onClick={joinGroup}>Join Group <ArrowRight size={18} /></button>
        </section>

        <section className="group-summary">
          <GroupStat icon={<Users size={20} />} label="Total Students" value={group?.totalStudents ?? "..."} />
          <GroupStat icon={<School size={20} />} label="Department" value={department} />
          <GroupStat icon={<GraduationCap size={20} />} label="Year & Semester" value={yearSemester} />
          <GroupStat icon={<Hash size={20} />} label="Section" value={group?.section || "A"} />
        </section>

        <section className="panel group-details-panel">
          <div className="section-title">
            <div>
              <p className="eyebrow">Group Details</p>
              <h2>{groupName}</h2>
            </div>
            <button className="secondary" onClick={editing ? cancelEdit : editGroup}>
              {editing ? <X size={18} /> : <Pencil size={18} />}
              {editing ? "Cancel" : "Edit Details"}
            </button>
          </div>

          {editing ? (
            <form className="group-edit-form" onSubmit={saveGroup}>
              <input name="groupName" placeholder="Group name" value={form.groupName} onChange={updateField} required />
              <input name="department" placeholder="Department" value={form.department} onChange={updateField} required />
              <input name="year" placeholder="Year, example: 3rd Year" value={form.year} onChange={updateField} required />
              <select name="semester" value={form.semester} onChange={updateField} required>
                <option value="1-1">1-1</option>
                <option value="1-2">1-2</option>
                <option value="2-1">2-1</option>
                <option value="2-2">2-2</option>
                <option value="3-1">3-1</option>
                <option value="3-2">3-2</option>
                <option value="4-1">4-1</option>
                <option value="4-2">4-2</option>
              </select>
              <input name="section" placeholder="Section" value={form.section} onChange={updateField} required />
              <input name="academicYear" placeholder="Academic year" value={form.academicYear} onChange={updateField} required />
              <input name="crName" placeholder="CR name" value={form.crName} onChange={updateField} required />
              <input name="facultyCoordinator" placeholder="Faculty coordinator" value={form.facultyCoordinator} onChange={updateField} required />
              <input name="joinCode" placeholder="Join code" value={form.joinCode} onChange={updateField} required />
              <button disabled={saving}><Save size={18} />{saving ? "Saving..." : "Save Details"}</button>
            </form>
          ) : (
            <div className="group-detail-grid">
              <span>Group Name<strong>{groupName}</strong></span>
              <span>Department<strong>{department}</strong></span>
              <span>Year and Semester<strong>{yearSemester}</strong></span>
              <span>Section<strong>{group?.section || "A"}</strong></span>
              <span>Total Students<strong>{group?.totalStudents ?? "..."}</strong></span>
              <span>CR Name<strong>{crName}</strong></span>
              <span>Faculty Coordinator<strong>{group?.facultyCoordinator || "Faculty Coordinator"}</strong></span>
              <span>Join Code<strong>{group?.joinCode || "DS31-CR"}</strong></span>
            </div>
          )}

          <div className="group-actions">
            <button onClick={joinGroup}><UserCheck size={18} />Join Group</button>
            <button className="secondary" onClick={() => navigate("/announcements")}><BookOpen size={18} />View Updates</button>
          </div>
        </section>
      </main>
    </>
  );
}

function defaultGroup(name) {
  return {
    groupName: "DS 3-1 Semester Group",
    academicYear: "2026-2027",
    department: "Data Science",
    year: "3rd Year",
    semester: "3-1",
    section: "A",
    crName: name || "Class Representative",
    facultyCoordinator: "Faculty Coordinator",
    joinCode: "DS31-CR",
    totalStudents: 0,
  };
}

function toGroupForm(group, name) {
  const fallback = defaultGroup(name);
  return {
    groupName: group?.groupName || fallback.groupName,
    academicYear: group?.academicYear || fallback.academicYear,
    department: group?.department || group?.branch || fallback.department,
    year: group?.year || fallback.year,
    semester: group?.semester || fallback.semester,
    section: group?.section || fallback.section,
    crName: group?.crName || fallback.crName,
    facultyCoordinator: group?.facultyCoordinator || fallback.facultyCoordinator,
    joinCode: group?.joinCode || fallback.joinCode,
  };
}

function GroupStat({ icon, label, value }) {
  return (
    <article>
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </article>
  );
}
