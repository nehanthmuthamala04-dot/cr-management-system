import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { endpoints } from "../api/client";
import NavBar from "../components/NavBar";
import StudentList from "../components/StudentList";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await endpoints.ranking();
      setStudents(data);
    } catch (error) {
      toast.error("Unable to load students");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <NavBar />
      <main className="page">
        <section className="page-header">
          <div>
            <p className="eyebrow">Student Management</p>
            <h1>Students</h1>
            <p className="muted">Add, edit, remove, search, filter, and import class student details.</p>
          </div>
        </section>
        {loading ? <div className="screen-loader">Loading students...</div> : <StudentList students={students} refresh={load} />}
      </main>
    </>
  );
}
