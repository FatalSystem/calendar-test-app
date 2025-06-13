"use client";

import React, { useEffect, useState, useCallback } from "react";
import { classesApi, Class } from "../api/classes";
import { BackendTeacher, Student as ApiStudent } from "../api/calendar";
import "./ClassesPage.css";

interface AddClassForm {
  date: string;
  studentId: string;
  teacherId: string;
  status: string;
}

interface Teacher {
  id: string;
  name: string;
}
interface Student {
  id: string;
  name: string;
}

interface CalendarEvent {
  id?: string;
  name?: string;
  student_name?: string;
  startDate?: string;
  date?: string;
  class_status?: string;
  status?: string;
  time?: string;
  class_type?: string;
  type?: string;
  teacher_id?: string;
  student_id?: string;
  teacher_name?: string;
  teacherId?: string;
  studentId?: string;
  teacherName?: string;
  studentName?: string;
  resourceId?: string;
  student_name_text?: string;
}

function CustomDropdown({
    label,
    options,
    value,
    onChange,
    placeholder,
  }: {
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.value === value);
    return (
      <div className="custom-dropdown">
        {label && <label className="dropdown-label">{label}</label>}
        <div
          className="custom-dropdown-btn"
          tabIndex={0}
          onClick={() => setOpen((v) => !v)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
        >
          <span>{selected ? selected.label : placeholder || "Select"}</span>
          <svg
            width="18"
            height="18"
            style={{ marginLeft: 8, opacity: 0.7 }}
            viewBox="0 0 24 24"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="#2563eb"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
        {open && (
          <div className="custom-dropdown-list">
            {options.map((opt) => (
              <div
                key={opt.value}
                className={
                  "custom-dropdown-item" +
                  (opt.value === value ? " selected" : "")
                }
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AddClassForm>({
    date: "",
    studentId: "",
    teacherId: "",
    status: "Given",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await classesApi.getAllClasses();
      console.log("Classes API response:", data);
      console.log("Current teachers:", teachers);
      console.log("Current students:", students);

      const mapped = data.map((event: CalendarEvent) => {
        const teacherId = (
          event.resourceId ??
          event.teacher_id ??
          event.teacherId ??
          ""
        ).toString();
        const studentId = (
          event.student_name ??
          event.student_id ??
          event.studentId ??
          ""
        ).toString();

        console.log("Processing event:", {
          event,
          teacherId,
          studentId,
          foundTeacher: teachers.find((t) => t.id === teacherId),
          foundStudent: students.find((s) => s.id === studentId),
        });

        return {
          id: event.id?.toString() || "",
          studentId,
          teacherId,
          studentName:
            event.student_name_text ||
            students.find((s) => s.id === studentId)?.name ||
            "",
          teacherName: teachers.find((t) => t.id === teacherId)?.name || "",
          date: event.startDate?.slice(0, 10) || event.date || "",
          status: event.class_status || event.status || "scheduled",
          time: event.startDate?.slice(11, 16) || event.time || "",
          type: event.class_type || event.type || "regular",
        };
      });
      console.log("Mapped classes:", mapped);
      setClasses(mapped);
      setError(null);
    } catch (err) {
      setError("Failed to fetch classes");
      console.error("Error fetching classes:", err);
    } finally {
      setLoading(false);
    }
  }, [teachers, students]);

  useEffect(() => {
    fetchTeachers();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (teachers.length > 0) {
      fetchClasses();
    }
  }, [teachers, fetchClasses]);

  const fetchTeachers = async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        console.log("No token found");
        setTeachers([]);
        return;
      }

      const res = await fetch("/api/proxy/teachers", {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          console.log("Token expired or invalid");
          localStorage.removeItem("token");
          setTeachers([]);
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Teachers API response:", data);

      if (data.msg) {
        console.log("API returned error message:", data.msg);
        setTeachers([]);
        return;
      }

      const arr: BackendTeacher[] = Array.isArray(data) ? data : data.teachers;

      if (!arr) {
        console.log("No teachers data found in response");
        setTeachers([]);
        return;
      }

      console.log("Processed teachers array:", arr);
      const mappedTeachers = arr.map((t) => ({
        id: t.id.toString(),
        name: `${t.first_name} ${t.last_name}`,
      }));
      console.log("Mapped teachers:", mappedTeachers);
      setTeachers(mappedTeachers);
    } catch (err) {
      console.error("Error loading teachers:", err);
      setTeachers([]);
    }
  };

  const fetchStudents = async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("/api/proxy/students", {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      console.log("Students API response:", data);
      const arr: ApiStudent[] = Array.isArray(data) ? data : data.students;
      console.log("Processed students array:", arr);
      const mappedStudents = arr.map((s) => ({
        id: s.id.toString(),
        name: `${s.first_name} ${s.last_name}`,
      }));
      console.log("Mapped students:", mappedStudents);
      setStudents(mappedStudents);
    } catch (err) {
      setStudents([]);
      console.error("Error loading students:", err);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setForm({ date: "", studentId: "", teacherId: "", status: "Given" });
    setFormError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormError(null);
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.studentId || !form.teacherId || !form.status) {
      setFormError("All fields are required");
      return;
    }

    try {
      const selectedStudent = students.find((s) => s.id === form.studentId);
      const selectedTeacher = teachers.find((t) => t.id === form.teacherId);

      if (!selectedStudent || !selectedTeacher) {
        setFormError("Invalid student or teacher selection");
        return;
      }

      const newClass = {
        date: form.date,
        studentId: form.studentId,
        teacherId: form.teacherId,
        status: form.status,
        studentName: selectedStudent.name,
        teacherName: selectedTeacher.name,
        time: new Date().toTimeString().slice(0, 5),
        type: "Manual",
      };

      await classesApi.addClass(newClass);
      handleCloseModal();
      fetchClasses();
    } catch (err) {
      setFormError("Failed to add class");
      console.error(err);
    }
  };

  // Форматування дати DD.MM.YYYY
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleDateString("uk-UA").replace(/\//g, ".");
  };

  if (loading) {
    return <div className="classes-page">Loading...</div>;
  }

  if (error) {
    return <div className="classes-page error">{error}</div>;
  }

  return (
    <div className="classes-page">
      <h1 style={{ marginBottom: 0 }}>Classes</h1>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          margin: "16px 0",
        }}
      >
        <button
          className="add-class-btn"
          onClick={handleOpenModal}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M12 5v14M5 12h14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Add Class
        </button>
      </div>
      <table className="classes-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Student</th>
            <th>Teacher</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((classItem) => (
            <tr key={classItem.id}>
              <td>{formatDate(classItem.date)}</td>
              <td>{classItem.studentName}</td>
              <td>
                {(() => {
                  const t = teachers.find(
                    (tc) => tc.id === classItem.teacherId
                  );
                  return t ? t.name : "";
                })()}
              </td>
              <td>
                <span
                  className={`status-badge status-${(
                    classItem.status || "scheduled"
                  ).toLowerCase()}`}
                >
                  {classItem.status || "Scheduled"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-button" onClick={handleCloseModal}>
              ×
            </button>
            <h2 className="modal-title">Add New Class</h2>
            <form className="modal-form" onSubmit={handleAddClass}>
              <div className="form-group">
                <label htmlFor="date">Class Date</label>
                <input
                  type="date"
                  id="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="student">Student</label>
                <CustomDropdown
                  label="Student"
                  options={[
                    { value: "", label: "Select student" },
                    ...students.map((s) => ({ value: s.id, label: s.name })),
                  ]}
                  value={form.studentId}
                  onChange={(v) => setForm({ ...form, studentId: v })}
                  placeholder="Select student"
                />
              </div>
              <div className="form-group">
                <label htmlFor="teacher">Teacher</label>
                <CustomDropdown
                  label="Teacher"
                  options={[
                    { value: "", label: "Select teacher" },
                    ...teachers.map((t) => ({ value: t.id, label: t.name })),
                  ]}
                  value={form.teacherId}
                  onChange={(v) => setForm({ ...form, teacherId: v })}
                  placeholder="Select teacher"
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <CustomDropdown
                  label="Status"
                  options={[
                    { value: "Given", label: "Given" },
                    { value: "No show student", label: "No show student" },
                    { value: "No show teacher", label: "No show teacher" },
                    { value: "Cancelled", label: "Cancelled" },
                  ]}
                  value={form.status}
                  onChange={(v) => setForm({ ...form, status: v })}
                  placeholder="Select status"
                />
              </div>
              {formError && <div className="form-error">{formError}</div>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-button secondary"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-button primary">
                  Add Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
