import { useState, useRef, useEffect } from "react";
import { calendarApi } from "@/app/api/calendar";
import { useCalendarContext } from "@/app/store/CalendarContext";
import React from "react";
import "./EventCreateForm.css";
import { TeacherWithColor } from "@/app/store/CalendarContext";
import type { LessonStatus, PaymentStatus } from "./types";

interface EventCreateFormProps {
  teachers: TeacherWithColor[];
  groups?: Group[];
  onClose: () => void;
}

interface Group {
  id: number;
  name: string;
  student_count: number;
  level?: string;
}

const classTypes = [
  { value: "trial", label: "Trial Lesson", duration: 30 },
  { value: "regular", label: "Regular Lesson", duration: 50 },
  { value: "instant", label: "Instant Lesson", duration: 50 },
  { value: "training", label: "Training", duration: 50, adminOnly: true },
];

const durations = [30, 50, 80];

const weekDays = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

function getUserRole() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("user-role") || "teacher";
  }
  return "teacher";
}

export default function EventCreateForm({
  teachers,
  groups = [],
  onClose,
}: EventCreateFormProps) {
  const [title, setTitle] = useState("");
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loading, setLoading] = useState(false);

  const [lessonType, setLessonType] = useState("individual");
  const [lessonTypeDropdownOpen, setLessonTypeDropdownOpen] = useState(false);

  const [classType, setClassType] = useState("regular");
  const [classTypeDropdownOpen, setClassTypeDropdownOpen] = useState(false);
  const [duration, setDuration] = useState(50);
  const [durationDropdownOpen, setDurationDropdownOpen] = useState(false);
  const [studentName, setStudentName] = useState("");

  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  const [repeatMode, setRepeatMode] = useState("none");
  const [repeatDays, setRepeatDays] = useState<string[]>([]);

  const { events, updateEvent, fetchEvents } = useCalendarContext();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lessonTypeDropdownRef = useRef<HTMLDivElement>(null);
  const classTypeDropdownRef = useRef<HTMLDivElement>(null);
  const durationDropdownRef = useRef<HTMLDivElement>(null);
  const groupDropdownRef = useRef<HTMLDivElement>(null);

  const userRole = getUserRole();

  const availableClassTypes = classTypes.filter(
    (type) =>
      !type.adminOnly || userRole === "accountant" || userRole === "super_admin"
  );

  const lessonTypeOptions = [
    { value: "individual", label: "Individual Lesson" },
    { value: "group", label: "Group Lesson" },
  ];

  useEffect(() => {
    if (start && duration) {
      const startDate = new Date(start);
      const endDate = new Date(startDate.getTime() + duration * 60000);
      setEnd(endDate.toISOString().slice(0, 16));
    }
  }, [start, duration]);

  useEffect(() => {
    const selectedType = classTypes.find((type) => type.value === classType);
    if (selectedType) {
      setDuration(selectedType.duration);
    }
  }, [classType]);

  useEffect(() => {
    if (lessonType === "individual") {
      setSelectedGroupId("");
    } else {
      setStudentName("");
    }
  }, [lessonType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        lessonTypeDropdownOpen &&
        lessonTypeDropdownRef.current &&
        !lessonTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setLessonTypeDropdownOpen(false);
      }
      if (
        classTypeDropdownOpen &&
        classTypeDropdownRef.current &&
        !classTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setClassTypeDropdownOpen(false);
      }
      if (
        durationDropdownOpen &&
        durationDropdownRef.current &&
        !durationDropdownRef.current.contains(event.target as Node)
      ) {
        setDurationDropdownOpen(false);
      }
      if (
        groupDropdownOpen &&
        groupDropdownRef.current &&
        !groupDropdownRef.current.contains(event.target as Node)
      ) {
        setGroupDropdownOpen(false);
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [
    dropdownOpen,
    lessonTypeDropdownOpen,
    classTypeDropdownOpen,
    durationDropdownOpen,
    groupDropdownOpen,
  ]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title || !teacherId || !start || !end) return;
    if (lessonType === "individual" && !studentName) return;
    if (lessonType === "group" && !selectedGroupId) return;

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
      const selectedGroup = groups.find(
        (g) => g.id.toString() === selectedGroupId
      );

      const optimisticEvent = {
        id: Date.now(),
        startDate: new Date(start).toISOString(),
        endDate: new Date(end).toISOString(),
        name: title,
        resourceId: String(teacherId),
        teacherColor: "#3174ad",
        eventColor: "#3174ad",
        class_type: classType,
        class_status: "scheduled" as LessonStatus,
        payment_status: "reserved" as PaymentStatus,
        duration: duration,
        isUnavailable: false,
        student_name: lessonType === "group" ? selectedGroupId : "5",
        student_name_text:
          lessonType === "group" ? selectedGroup?.name || "" : studentName,
        calendar_id: 0,
        student_id: lessonType === "group" ? parseInt(selectedGroupId) : 5,
        lesson_type: lessonType,
        group_id: lessonType === "group" ? parseInt(selectedGroupId) : null,
      };

      updateEvent(Date.now(), optimisticEvent);

      const calendarResponse = await calendarApi.createCalendar({
        class_type: classType,
        student_id: lessonType === "group" ? parseInt(selectedGroupId) : 5,
        teacher_id: Number(teacherId),
        class_status: "scheduled" as LessonStatus,
        payment_status: "reserved" as PaymentStatus,
        startDate: new Date(start).toISOString(),
        endDate: new Date(end).toISOString(),
        duration: duration,
      });

      updateEvent(Date.now(), calendarResponse);
      await fetchEvents();
      onClose();
    } catch (error) {
      console.error("Failed to create event:", error);
      alert("Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const selectedTeacher = teachers.find(
    (t) => String(t.id) === String(teacherId)
  );
  const selectedClassType = availableClassTypes.find(
    (type) => type.value === classType
  );
  const selectedLessonType = lessonTypeOptions.find(
    (type) => type.value === lessonType
  );
  const selectedGroup = groups.find((g) => g.id.toString() === selectedGroupId);

  return (
    <form onSubmit={handleSubmit} className="form compact">
      {/* Title and Teacher - Side by side */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="label">Title</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Lesson title"
          />
        </div>
        <div className="flex-1">
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
                  ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}`
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
                    {`${t.first_name} ${t.last_name}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lesson Type and Class Type - Side by side */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="label">Lesson Type</label>
          <div className="dropdown" ref={lessonTypeDropdownRef}>
            <button
              type="button"
              className="dropdown-button"
              onClick={() => setLessonTypeDropdownOpen((v) => !v)}
            >
              <span>{selectedLessonType?.label || "Select lesson type"}</span>
              <svg
                className={`w-4 h-4 ml-2 transition-transform ${
                  lessonTypeDropdownOpen ? "rotate-180" : ""
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
            {lessonTypeDropdownOpen && (
              <div className="dropdown-menu">
                {lessonTypeOptions.map((type) => (
                  <button
                    type="button"
                    key={type.value}
                    className={`dropdown-item ${
                      type.value === lessonType ? "selected" : ""
                    }`}
                    onClick={() => {
                      setLessonType(type.value);
                      setLessonTypeDropdownOpen(false);
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Class Type - Available for both individual and group lessons */}
        <div className="flex-1">
          <label className="label">Class Type</label>
          <div className="dropdown" ref={classTypeDropdownRef}>
            <button
              type="button"
              className="dropdown-button"
              onClick={() => setClassTypeDropdownOpen((v) => !v)}
            >
              <span>{selectedClassType?.label || "Select type"}</span>
              <svg
                className={`w-4 h-4 ml-2 transition-transform ${
                  classTypeDropdownOpen ? "rotate-180" : ""
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
            {classTypeDropdownOpen && (
              <div className="dropdown-menu">
                {availableClassTypes.map((type) => (
                  <button
                    type="button"
                    key={type.value}
                    className={`dropdown-item ${
                      type.value === classType ? "selected" : ""
                    }`}
                    onClick={() => {
                      setClassType(type.value);
                      setClassTypeDropdownOpen(false);
                    }}
                  >
                    <div>
                      <div>{type.label}</div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                        {type.duration} minutes
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Duration (only for non-trial lessons) */}
      {classType !== "trial" && (
        <div>
          <label className="label">Duration</label>
          <div className="dropdown" ref={durationDropdownRef}>
            <button
              type="button"
              className="dropdown-button"
              onClick={() => setDurationDropdownOpen((v) => !v)}
            >
              <span>{duration} min</span>
              <svg
                className={`w-4 h-4 ml-2 transition-transform ${
                  durationDropdownOpen ? "rotate-180" : ""
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
            {durationDropdownOpen && (
              <div className="dropdown-menu">
                {durations.map((dur) => (
                  <button
                    type="button"
                    key={dur}
                    className={`dropdown-item ${
                      dur === duration ? "selected" : ""
                    }`}
                    onClick={() => {
                      setDuration(dur);
                      setDurationDropdownOpen(false);
                    }}
                  >
                    {dur} minutes
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Start Time and Student/Group - Side by side */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="label">Start Time</label>
          <input
            className="input"
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </div>
        <div className="flex-1">
          {lessonType === "individual" ? (
            <>
              <label className="label">Student Name</label>
              <input
                className="input"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                placeholder="Enter student name"
              />
            </>
          ) : (
            <>
              <label className="label">Select Group</label>
              <div className="dropdown" ref={groupDropdownRef}>
                <button
                  type="button"
                  className="dropdown-button"
                  onClick={() => setGroupDropdownOpen((v) => !v)}
                >
                  <span>
                    {selectedGroup
                      ? `${selectedGroup.name} (${selectedGroup.student_count} students)`
                      : "Select group"}
                  </span>
                  <svg
                    className={`w-4 h-4 ml-2 transition-transform ${
                      groupDropdownOpen ? "rotate-180" : ""
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
                {groupDropdownOpen && (
                  <div className="dropdown-menu">
                    {groups.length > 0 ? (
                      groups.map((group) => (
                        <button
                          type="button"
                          key={group.id}
                          className={`dropdown-item ${
                            group.id.toString() === selectedGroupId
                              ? "selected"
                              : ""
                          }`}
                          onClick={() => {
                            setSelectedGroupId(group.id.toString());
                            setGroupDropdownOpen(false);
                          }}
                        >
                          <div>
                            <div>{group.name}</div>
                            <div
                              style={{ fontSize: "0.75rem", color: "#6b7280" }}
                            >
                              {group.student_count} students
                              {group.level && ` • ${group.level}`}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="dropdown-item" style={{ opacity: 0.6 }}>
                        No groups available
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Repeat Mode */}
      <div>
        <label className="label">Repeating</label>
        <div className="dropdown">
          <button
            type="button"
            className="dropdown-button"
            onClick={() => {
              const newMode = repeatMode === "none" ? "weekly" : "none";
              setRepeatMode(newMode);
              if (newMode === "none") setRepeatDays([]);
            }}
          >
            <span>
              {repeatMode === "none"
                ? "Does not repeat"
                : "Weekly on certain days"}
            </span>
            <svg
              className="w-4 h-4 ml-2"
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
        </div>
      </div>

      {/* Weekly Repeat Days */}
      {repeatMode === "weekly" && (
        <div>
          <label className="label">Repeat on Days</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "0.5rem",
            }}
          >
            {weekDays.map((day) => (
              <label
                key={day.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  backgroundColor: repeatDays.includes(day.value)
                    ? "#dbeafe"
                    : "#f9fafb",
                  borderColor: repeatDays.includes(day.value)
                    ? "#3b82f6"
                    : "#d1d5db",
                  fontSize: "0.75rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={repeatDays.includes(day.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setRepeatDays([...repeatDays, day.value]);
                    } else {
                      setRepeatDays(repeatDays.filter((d) => d !== day.value));
                    }
                  }}
                  style={{ width: "0.75rem", height: "0.75rem" }}
                />
                <span>{day.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-4 justify-end">
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
