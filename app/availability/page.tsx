"use client";

import React, { useState, useEffect } from "react";
import "./AvailabilityPage.css";
import { calendarApi } from "../api/calendar";
import { LessonStatus, PaymentStatus } from "../components/calendar/types";
import { useRouter } from "next/navigation";
import { useSidebar } from "../store/SidebarContext";

interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function AvailabilityPage() {
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [repeat, setRepeat] = useState(false);
  const [repeatDays, setRepeatDays] = useState<string[]>([]);
  const [repeatWeeks, setRepeatWeeks] = useState(1);
  const router = useRouter();
  const { openSidebar } = useSidebar();

  useEffect(() => {
    openSidebar();
  });

  useEffect(() => {
    calendarApi.getTeachers().then((data) => {
      setTeachers(data);
      console.log("Fetched teachers:", data);
      if (data.length > 0) setSelectedTeacherId(String(data[0].id));
    });
  }, []);

  function getCurrentTeacherId() {
    return selectedTeacherId;
  }

  const handleAddRange = async () => {
    if (!startTime || !endTime) {
      alert("Please specify both start and end time.");
      return;
    }
    if (!getCurrentTeacherId()) {
      setError("Please select a teacher");
      return;
    }
    if (!selectedDate) {
      setError("Please select a date");
      return;
    }
    if (repeat && repeatDays.length === 0) {
      setError("Please select at least one day for repeat");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const teacherId = getCurrentTeacherId();
      if (repeat) {
        // Repeat logic: for each week, for each selected day
        const start = new Date(selectedDate);
        for (let week = 0; week < repeatWeeks; week++) {
          for (const day of repeatDays) {
            // Find the date for this day in this week
            const dayIndex = DAYS.indexOf(day);
            const base = new Date(start);
            base.setDate(base.getDate() + 7 * week);
            const baseDay = base.getDay() === 0 ? 6 : base.getDay() - 1; // Monday=0
            const diff = dayIndex - baseDay;
            const eventDate = new Date(base);
            eventDate.setDate(base.getDate() + diff);
            const startDate = new Date(
              `${eventDate.toISOString().slice(0, 10)}T${startTime}`
            );
            const endDate = new Date(
              `${eventDate.toISOString().slice(0, 10)}T${endTime}`
            );
            await calendarApi.createCalendar({
              class_type: "unavailable",
              student_id: 0,
              teacher_id: parseInt(teacherId),
              class_status: "Unavailable" as LessonStatus,
              payment_status: "reserved" as PaymentStatus,
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              duration: (endDate.getTime() - startDate.getTime()) / 60000,
            });
          }
        }
      } else {
        // Single event
        const startDate = new Date(`${selectedDate}T${startTime}`);
        const endDate = new Date(`${selectedDate}T${endTime}`);
        await calendarApi.createCalendar({
          class_type: "unavailable",
          student_id: 0,
          teacher_id: parseInt(teacherId),
          class_status: "Unavailable" as LessonStatus,
          payment_status: "reserved" as PaymentStatus,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          duration: (endDate.getTime() - startDate.getTime()) / 60000,
        });
      }
      router.push("/");
      return;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add unavailable block"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container availability">
      <h1 className="heading">Set Your Availability</h1>
      {error && (
        <div style={{ color: "#dc2626", marginBottom: 8 }}>{error}</div>
      )}
      <div className="form-group">
        <label>Teacher</label>
        {teachers.length === 0 ? (
          <div style={{ color: "#dc2626", marginBottom: 8 }}>
            No teachers found
          </div>
        ) : (
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            disabled={loading}
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.first_name} {t.last_name}
              </option>
            ))}
          </select>
        )}

        <label>Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          disabled={loading}
        />

        <div className="repeat-section">
          <label className="repeat-checkbox">
            <input
              type="checkbox"
              checked={repeat}
              onChange={(e) => setRepeat(e.target.checked)}
              disabled={loading}
            />
            Repeat
          </label>

          {repeat && (
            <div className="repeat-options">
              <div className="days-grid">
                {DAYS.map((day) => (
                  <label key={day} className="day-checkbox">
                    <input
                      type="checkbox"
                      checked={repeatDays.includes(day)}
                      onChange={(e) => {
                        if (e.target.checked)
                          setRepeatDays([...repeatDays, day]);
                        else setRepeatDays(repeatDays.filter((d) => d !== day));
                      }}
                      disabled={loading}
                    />
                    {day.slice(0, 3)}
                  </label>
                ))}
              </div>

              <div className="weeks-input">
                <span>Repeat for</span>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={repeatWeeks}
                  onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                  disabled={loading}
                />
                <span>weeks</span>
              </div>
            </div>
          )}
        </div>

        <label>Start Time</label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          disabled={loading}
        />

        <label>End Time</label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          disabled={loading}
        />
      </div>

      <button
        onClick={handleAddRange}
        disabled={loading || !selectedTeacherId || teachers.length === 0}
      >
        {loading ? "Adding..." : "Add Unavailable Time"}
      </button>
    </div>
  );
}
