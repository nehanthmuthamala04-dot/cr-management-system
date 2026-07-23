import { CalendarPlus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { endpoints } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { localDateValue } from "../utils";

export default function HolidayManager({ onChange }) {
  const { user } = useAuth();
  const canManage = ["admin", "cr"].includes(user?.role);
  const [holidays, setHolidays] = useState([]);
  const [form, setForm] = useState({ date: localDateValue(), title: "Holiday" });

  async function load() {
    const { data } = await endpoints.holidays();
    setHolidays(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event) {
    event.preventDefault();
    try {
      await endpoints.addHoliday(form);
      toast.success("Holiday added");
      await load();
      onChange?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to add holiday");
    }
  }

  async function remove(date) {
    try {
      await endpoints.deleteHoliday(date);
      toast.success("Holiday removed");
      await load();
      onChange?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to remove holiday");
    }
  }

  return (
    <section className="panel holiday-panel">
      <div className="section-title">
        <div>
          <p className="eyebrow">Calendar</p>
          <h2>Holidays</h2>
        </div>
        <span>{holidays.length}</span>
      </div>

      {canManage && (
        <form className="holiday-form" onSubmit={submit}>
          <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Holiday title" />
          <button><CalendarPlus size={18} />Add Holiday</button>
        </form>
      )}

      {holidays.length === 0 ? (
        <p className="empty">No extra holidays added. Saturdays and Sundays are already excluded.</p>
      ) : (
        <div className="holiday-list">
          {holidays.map((holiday) => (
            <div className="holiday-row" key={holiday.date}>
              <div>
                <strong>{holiday.date}</strong>
                <small>{holiday.title}</small>
              </div>
              {canManage && <button className="secondary" onClick={() => remove(holiday.date)}><Trash2 size={17} /></button>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
