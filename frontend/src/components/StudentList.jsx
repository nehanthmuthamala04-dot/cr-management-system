import { FileUp, Pencil, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { endpoints } from "../api/client";
import { useAuth } from "../contexts/AuthContext";

const emptyForm = {
  rollNumber: "",
  name: "",
  email: "",
  phone: "",
  department: "",
  year: "",
  semester: "",
  section: "",
};

export default function StudentList({ students, refresh, readOnly = false }) {
  const { user } = useAuth();
  const canManage = !readOnly && ["admin", "cr"].includes(user?.role);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState({ department: "", year: "", semester: "", section: "" });

  const filteredStudents = students.filter((student) => {
    const searchText = [
      student.rollNumber,
      student.name,
      student.email,
      student.phone,
      student.department,
      student.year,
      student.semester,
      student.section,
    ].join(" ").toLowerCase();
    const matchesSearch = searchText.includes(query.toLowerCase());
    const matchesFilter = Object.entries(filter).every(([key, value]) => !value || student[key] === value);
    return matchesSearch && matchesFilter;
  });

  const filterOptions = (key) => [...new Set(students.map((student) => student[key]).filter(Boolean))].sort();

  async function addStudent(event) {
    event.preventDefault();
    try {
      if (editingId) {
        await endpoints.updateStudent(editingId, form);
        toast.success("Student updated");
      } else {
        await endpoints.addStudent(form);
        toast.success("Student added");
      }
      setForm(emptyForm);
      setEditingId(null);
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to add student");
    }
  }

  async function remove(student) {
    try {
      await endpoints.deleteStudent(student.id);
      toast.success("Student removed");
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to remove student");
    }
  }

  function edit(student) {
    setEditingId(student.id);
    setForm({
      rollNumber: student.rollNumber || "",
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      department: student.department || "",
      year: student.year || "",
      semester: student.semester || "",
      section: student.section || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function importStudents(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = text.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
    const delimiter = text.includes("\t") ? "\t" : ",";
    const headers = rows.shift()?.split(delimiter).map((header) => header.trim()) || [];
    let imported = 0;
    for (const row of rows) {
      const values = row.split(delimiter).map((value) => value.trim());
      const student = headers.reduce((acc, header, index) => ({ ...acc, [header]: values[index] || "" }), {});
      if (!student.name || !student.rollNumber) continue;
      try {
        await endpoints.addStudent({ ...emptyForm, ...student });
        imported += 1;
      } catch (error) {
        // Skip duplicates during import so one bad row does not stop the whole file.
      }
    }
    event.target.value = "";
    toast.success(`${imported} students imported`);
    refresh();
  }

  return (
    <section className="panel">
      <div className="section-title">
        <h2>{readOnly ? "Student Details" : "Student List"}</h2>
        <span>{filteredStudents.length} of {students.length} students</span>
      </div>
      {canManage && (
        <form className="student-form" onSubmit={addStudent}>
          <input placeholder="Roll number" value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} required />
          <input placeholder="Student name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="Class" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
          <input placeholder="Section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
          <button>{editingId ? "Save Student" : "Add Student"}</button>
          {editingId && <button className="secondary" type="button" onClick={cancelEdit}><X size={17} />Cancel</button>}
        </form>
      )}
      <div className="student-tools">
        <label className="search-field"><Search size={17} /><input placeholder="Search students" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
        {["department", "year", "semester", "section"].map((key) => (
          <select key={key} value={filter[key]} onChange={(e) => setFilter({ ...filter, [key]: e.target.value })}>
            <option value="">All {key}</option>
            {filterOptions(key).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        ))}
        {canManage && (
          <label className="import-button">
            <FileUp size={17} />Import Excel/CSV
            <input type="file" accept=".csv,.txt,.tsv" onChange={importStudents} />
          </label>
        )}
      </div>
      {students.length === 0 ? (
        <p className="empty">Add students or import a CSV file to build the class list.</p>
      ) : (
        <div className="table">
          {filteredStudents.map((student, index) => (
            <div className="table-row student-row" key={student.id || student.rollNumber}>
              <span className="rank">{index + 1}</span>
              <div>
                <strong>{student.name}</strong>
                <small>Roll No: {student.rollNumber}</small>
                <small>Class: {student.year || "Not set"}</small>
                <small>Section: {student.section || "Not set"}</small>
              </div>
              {canManage && (
                <div className="row-actions">
                  <button className="secondary" title="Edit student" onClick={() => edit(student)}><Pencil size={17} /></button>
                  <button className="secondary" title="Remove student" onClick={() => remove(student)}><Trash2 size={17} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
