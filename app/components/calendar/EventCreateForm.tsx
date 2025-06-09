import { useState, useRef } from "react";
import { calendarApi } from "@/app/api/calendar";
import { useCalendarContext } from "@/app/store/CalendarContext";
import React from "react";
import "./EventCreateForm.css";

export default function EventCreateForm({
  teachers,
  onClose,
}: {
  teachers: any[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const { events, updateEvent, fetchEvents } = useCalendarContext();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  // (simple version for now)
  if (typeof window !== "undefined") {
    window.onclick = (e: any) => {
      if (
        dropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !teacherId || !start || !end) return;
    // Check for overlap
    const overlap = events.some((event) => {
      const eventTeacherId = event.resourceId || event.teacher_id?.toString();
      if (String(eventTeacherId) !== String(teacherId)) return false;
      const eventStart = new Date(event.startDate).getTime();
      const eventEnd = new Date(event.endDate).getTime();
      const selectStart = new Date(start).getTime();
      const selectEnd = new Date(end).getTime();
      return selectStart < eventEnd && selectEnd > eventStart;
    });
    if (overlap) {
      alert(
        "There is already a scheduled event for this teacher at the selected time."
      );
      return;
    }
    setLoading(true);
    try {
      const optimisticEvent = {
        id: Date.now(),
        startDate: new Date(start).toISOString(),
        endDate: new Date(end).toISOString(),
        name: title,
        resourceId: String(teacherId),
        teacherColor: "#3174ad",
        eventColor: "#3174ad",
        class_type: "regular",
        class_status: "scheduled",
        payment_status: "unpaid",
        duration: 50,
        isUnavailable: false,
        student_name: "5",
        student_name_text: "Student Name",
        calendar_id: 0,
        student_id: 5,
      };
      updateEvent(Date.now(), optimisticEvent);
      const calendarResponse = await calendarApi.createCalendar({
        class_type: title,
        student_id: 5,
        teacher_id: teacherId,
        class_status: "scheduled",
        payment_status: "unpaid",
        startDate: new Date(start).toISOString(),
        endDate: new Date(end).toISOString(),
        duration: 50,
      });
      updateEvent(Date.now(), calendarResponse);
      await fetchEvents();
      onClose();
    } catch (e) {
      alert("Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const selectedTeacher = teachers.find(
    (t) => String(t.id) === String(teacherId)
  );

  return (
    <form onSubmit={handleSubmit} className="form">
      <div>
        <label className="label">Title</label>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Enter event title"
        />
      </div>
      <div>
        <label className="label">Teacher</label>
        <div className="dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="dropdown-button"
            onClick={() => setDropdownOpen((v) => !v)}
          >
            <span className="flex items-center gap-2">
              <span
                className="inline-block w-4 h-4 rounded-full border"
                style={{ background: selectedTeacher?.color || "#2563eb" }}
              ></span>
              {selectedTeacher
                ? selectedTeacher.first_name
                  ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}`
                  : selectedTeacher.name
                : "Select teacher"}
            </span>
            <svg
              className={`w-4 h-4 ml-2 transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="dropdown-menu">
              {teachers.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  className={`dropdown-item ${
                    String(t.id) === String(teacherId) ? "selected" : ""
                  }`}
                  onClick={() => {
                    setTeacherId(t.id);
                    setDropdownOpen(false);
                  }}
                >
                  <span
                    className="inline-block w-4 h-4 rounded-full border"
                    style={{ background: t.color || "#2563eb" }}
                  ></span>
                  {t.first_name ? `${t.first_name} ${t.last_name}` : t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="label">Start</label>
          <input
            className="input"
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </div>
        <div className="flex-1">
          <label className="label">End</label>
          <input
            className="input"
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="flex gap-2 mt-8 justify-end">
        <button
          type="button"
          className="button cancel"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className="button submit" disabled={loading}>
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}
