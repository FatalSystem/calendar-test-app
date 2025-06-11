import { useState, useRef, useEffect } from "react";
import { calendarApi } from "@/app/api/calendar";
import React from "react";
import "./EventCreateForm.css";
import { TeacherWithColor } from "@/app/store/CalendarContext";
import { DateTime } from "luxon";

type LessonStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "student_no_show"
  | "teacher_no_show";
type PaymentStatus = "paid" | "reserved";

interface Student {
  id: number;
  first_name: string;
  last_name: string;
}

interface EventCreateFormProps {
  teachers: TeacherWithColor[];
  onClose: () => void;
  onSuccess?: () => void;
  timezone?: string;
  start?: Date | null;
  end?: Date | null;
}

const classTypes = [
  { value: "trial", label: "Trial Lesson", duration: 30 },
  { value: "regular", label: "Regular Lesson", duration: 50 },
  { value: "instant", label: "Instant Lesson", duration: 50 },
  { value: "unavailable", label: "Unavailable", duration: 0 },
  { value: "group", label: "Group Lesson", duration: 50 },
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

const lessonStatusOptions: { value: LessonStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "student_no_show", label: "Student No Show" },
  { value: "teacher_no_show", label: "Teacher No Show" },
];

// Mock students and groups
const mockGroups = [
  { id: 1, name: "Group A" },
  { id: 2, name: "Group B" },
  { id: 3, name: "Group C" },
];

export default function EventCreateForm({
  teachers,
  onClose,
  onSuccess,
  timezone = "local",
  start: defaultStart = null,
  end: defaultEnd = null,
}: EventCreateFormProps & {
  timezone?: string;
  start?: Date | null;
  end?: Date | null;
}) {
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [start, setStart] = useState(
    defaultStart ? defaultStart.toISOString().slice(0, 16) : ""
  );
  const [end, setEnd] = useState(
    defaultEnd ? defaultEnd.toISOString().slice(0, 16) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [classStatus, setClassStatus] = useState<LessonStatus>("scheduled");
  const [classStatusDropdownOpen, setClassStatusDropdownOpen] = useState(false);

  const [classType, setClassType] = useState("regular");
  const [classTypeDropdownOpen, setClassTypeDropdownOpen] = useState(false);
  const [duration, setDuration] = useState(50);
  const [durationDropdownOpen, setDurationDropdownOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");

  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  const [repeatMode, setRepeatMode] = useState("none");
  const [repeatDays, setRepeatDays] = useState<string[]>([]);
  const [repeatWeeks, setRepeatWeeks] = useState(2);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const classTypeDropdownRef = useRef<HTMLDivElement>(null);
  const durationDropdownRef = useRef<HTMLDivElement>(null);
  const groupDropdownRef = useRef<HTMLDivElement>(null);
  const classStatusDropdownRef = useRef<HTMLDivElement>(null);
  const repeatModeDropdownRef = useRef<HTMLDivElement>(null);

  const userRole = getUserRole();

  const availableClassTypes = classTypes.filter(
    (type) =>
      !type.adminOnly || userRole === "accountant" || userRole === "super_admin"
  );

  const [students, setStudents] = useState<Student[]>([]);
  useEffect(() => {
    async function fetchStudents() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch("/api/proxy/students", {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setStudents(
            (data as Student[]).sort((a: Student, b: Student) =>
              a.last_name.localeCompare(b.last_name)
            )
          );
        } else if (Array.isArray(data.students)) {
          setStudents(
            (data.students as Student[]).sort((a: Student, b: Student) =>
              a.last_name.localeCompare(b.last_name)
            )
          );
        }
      } catch {
        setStudents([]);
      }
    }
    fetchStudents();
  }, []);

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
    if (classType === "group") {
      setStudentId("");
    } else {
      setSelectedGroupId("");
    }
  }, [classType]);

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
      if (
        classStatusDropdownOpen &&
        classStatusDropdownRef.current &&
        !classStatusDropdownRef.current.contains(event.target as Node)
      ) {
        setClassStatusDropdownOpen(false);
      }
      if (
        repeatMode === "weekly" &&
        repeatModeDropdownRef.current &&
        !repeatModeDropdownRef.current.contains(event.target as Node)
      ) {
        setRepeatMode("none");
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [
    dropdownOpen,
    classTypeDropdownOpen,
    durationDropdownOpen,
    groupDropdownOpen,
    classStatusDropdownOpen,
    repeatMode,
  ]);

  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    if (!teacherId) {
      setError("Please select a teacher");
      setLoading(false);
      return;
    }

    if (!start || !end) {
      setError("Please select start and end time");
      setLoading(false);
      return;
    }

    if (classType === "group") {
      if (!selectedGroupId) {
        setError("Please select a group");
        setLoading(false);
        return;
      }
    } else {
      if (!studentId) {
        setError("Please select a student");
        setLoading(false);
        return;
      }
    }

    // Fetch student class balance before creating event
    let paymentStatusToUse = "reserved";
    if (classType !== "group" && studentId) {
      try {
        const balanceRes = await calendarApi.getStudentRemainingClasses(
          parseInt(studentId)
        );
        const paidCount = balanceRes?.remaining || 0;
        const isTrial = classType === "trial";
        // Only check for regular lessons
        if (!isTrial) {
          if (paidCount > 0) {
            paymentStatusToUse = "paid";
          } else {
            // Check if lesson is less than 12 hours from now
            const startDateTime = DateTime.fromISO(start, { zone: timezone });
            const now = DateTime.now().setZone(timezone);
            const diffHours = startDateTime.diff(now, "hours").hours;
            if (diffHours < 12) {
              setError(
                "Cannot add a lesson for this student less than 12 hours ahead without paid classes."
              );
              setLoading(false);
              return;
            }
            paymentStatusToUse = "reserved";
          }
        }
      } catch {
        setError("Failed to check student class balance");
        setLoading(false);
        return;
      }
    }

    try {
      console.log("Submitting form with data:", {
        classType,
        studentId,
        teacherId,
        classStatus,
        paymentStatus: paymentStatusToUse,
        start,
        end,
        duration,
      });

      // Convert start and end to UTC using selected timezone
      const startUTC =
        DateTime.fromISO(start, { zone: timezone }).toUTC().toISO() || "";
      const endUTC =
        DateTime.fromISO(end, { zone: timezone }).toUTC().toISO() || "";

      const eventData = {
        class_type: classType,
        student_id:
          classType === "group"
            ? parseInt(selectedGroupId)
            : parseInt(studentId),
        teacher_id: parseInt(String(teacherId)),
        class_status: classStatus,
        payment_status: paymentStatusToUse as PaymentStatus,
        start_date: startUTC,
        end_date: endUTC,
        duration: Number(duration),
      };

      console.log("Sending event data to backend:", eventData);

      const result = await calendarApi.createCalendar(eventData);
      console.log("Event created successfully:", result);

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error creating event:", err);
      setError(err instanceof Error ? err.message : "Failed to create event");
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

  return (
    <form onSubmit={handleSubmit} className="form compact">
      {error && (
        <div
          className="error-message"
          style={{ color: "red", marginBottom: "1rem" }}
        >
          {error}
        </div>
      )}
      {/* Title and Teacher - Side by side */}
      <div className="flex gap-4">
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

      {/* Class Type and Class Status - Side by side */}
      <div className="flex gap-4">
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
                    <div>{type.label}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1">
          <label className="label">Class Status</label>
          <div className="dropdown" ref={classStatusDropdownRef}>
            <button
              type="button"
              className="dropdown-button"
              onClick={() => setClassStatusDropdownOpen((v) => !v)}
            >
              <span>
                {lessonStatusOptions.find((opt) => opt.value === classStatus)
                  ?.label || "Select status"}
              </span>
              <svg
                className={`w-4 h-4 ml-2 transition-transform ${
                  classStatusDropdownOpen ? "rotate-180" : ""
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
            {classStatusDropdownOpen && (
              <div className="dropdown-menu">
                {lessonStatusOptions.map((type) => (
                  <button
                    type="button"
                    key={type.value}
                    className={`dropdown-item ${
                      type.value === classStatus ? "selected" : ""
                    }`}
                    onClick={() => {
                      setClassStatus(type.value);
                      setClassStatusDropdownOpen(false);
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Duration (only for non-trial lessons) */}
      {classType === "trial" ? (
        <div>
          <label className="label">Duration</label>
          <input
            className="input"
            value={30}
            disabled
            style={{ background: "#f3f4f6", color: "#888" }}
          />
        </div>
      ) : (
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
          {classType === "group" ? (
            <>
              <label className="label">Select Group</label>
              <div className="dropdown">
                <button
                  type="button"
                  className="dropdown-button"
                  onClick={() => setGroupDropdownOpen((v) => !v)}
                >
                  <span>
                    {selectedGroupId
                      ? mockGroups.find(
                          (g) => g.id.toString() === selectedGroupId
                        )?.name
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
                    {mockGroups.map((group) => (
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
                        {group.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <label className="label">Student</label>
              <div className="dropdown">
                <button
                  type="button"
                  className="dropdown-button"
                  onClick={() => setGroupDropdownOpen((v) => !v)}
                >
                  <span>{studentName || "Select student"}</span>
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
                    {students.map((student) => (
                      <button
                        type="button"
                        key={student.id}
                        className={`dropdown-item ${
                          student.id.toString() === studentId ? "selected" : ""
                        }`}
                        onClick={() => {
                          setStudentId(student.id.toString());
                          setStudentName(
                            `${student.first_name} ${student.last_name}`
                          );
                          setGroupDropdownOpen(false);
                        }}
                      >
                        {student.first_name} {student.last_name}
                      </button>
                    ))}
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
        <div className="dropdown" ref={repeatModeDropdownRef}>
          <button
            type="button"
            className="dropdown-button"
            onClick={() => {
              const newMode = repeatMode === "none" ? "weekly" : "none";
              setRepeatMode(newMode);
              if (newMode === "none") {
                setRepeatDays([]);
                setRepeatWeeks(2);
              }
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

      {/* Repeat for N weeks */}
      {repeatMode === "weekly" && (
        <div style={{ marginTop: "1rem" }}>
          <label className="label">Repeat for</label>
          <input
            type="number"
            min={1}
            max={12}
            value={repeatWeeks}
            onChange={(e) => setRepeatWeeks(Number(e.target.value))}
            style={{
              width: 60,
              marginRight: 8,
              borderRadius: 8,
              border: "1px solid #d1d5db",
              padding: "0.25rem 0.5rem",
            }}
          />
          <span style={{ fontSize: "0.95rem" }}>weeks</span>
        </div>
      )}

      <div className="flex gap-2 mt-4 justify-end button-row-sticky">
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
