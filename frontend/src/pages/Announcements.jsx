import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { endpoints } from "../api/client";
import NavBar from "../components/NavBar";
import { useAuth } from "../contexts/AuthContext";

export default function Announcements() {
  const { user } = useAuth();
  const canEdit = ["admin", "cr"].includes(user?.role);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", message: "" });

  async function load() {
    const { data } = await endpoints.announcements();
    setItems(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event) {
    event.preventDefault();
    try {
      await endpoints.createAnnouncement(form);
      setForm({ title: "", message: "" });
      toast.success("Announcement created");
      load();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to save announcement");
    }
  }

  async function remove(id) {
    try {
      await endpoints.deleteAnnouncement(id);
      toast.success("Announcement deleted");
      load();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to delete announcement");
    }
  }

  return (
    <>
      <NavBar />
      <main className="page announcements-page">
        <section className="page-header">
          <div>
            <p className="eyebrow">Class Updates</p>
            <h1>Announcements</h1>
            <p className="muted">Share important notices and keep the group aligned.</p>
          </div>
        </section>
        <section className="panel">
          <div className="section-title">
            <h1>Announcements</h1>
            <span>{items.length}</span>
          </div>
          {canEdit && (
            <form className="announcement-form" onSubmit={submit}>
              <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <textarea placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <button><Plus size={18} />Create</button>
            </form>
          )}
          <div className="announcement-list">
            {items.length === 0 ? <p className="empty">No announcements yet.</p> : items.map((item) => (
              <article className="announcement-card" key={item._id}>
                <div>
                  <h2>{item.title}</h2>
                  <p>{item.message}</p>
                </div>
                {canEdit && (
                  <div className="row-actions">
                    <button disabled title="Edit from API ready endpoint"><Pencil size={17} /></button>
                    <button onClick={() => remove(item._id)}><Trash2 size={17} /></button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
