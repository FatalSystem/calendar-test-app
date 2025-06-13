"use client";
import React, { useEffect, useState, useCallback } from "react";
import { calendarApi } from "../api/calendar";
import "../classes/ClassesPage.css";
import "../teachers/TeachersPage.css";
import { useSidebar } from "../store/SidebarContext";
import styles from "./TeachersPage.module.css";
import { useRouter } from "next/navigation";

interface TeacherForm {
  first_name: string;
  last_name: string;
  email: string;
  trialRate: string;
  regularRate: string;
  trainingRate: string;
  password?: string;
}

interface ApiResponse {
  error?: string;
  details?: {
    msg: string;
  };
  data?: BackendTeacher[];
}

interface TeacherRate {
  class_type_id: number;
  class_type_name: string;
  rate: string;
}

export interface BackendTeacher {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  rates?: TeacherRate[];
}

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<BackendTeacher[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<TeacherForm>({
    first_name: "",
    last_name: "",
    email: "",
    trialRate: "",
    regularRate: "",
    trainingRate: "",
    password: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { openSidebar } = useSidebar();

  const fetchTeachers = useCallback(async () => {
    try {
      const response = await calendarApi.getTeachers();
      console.log("Teachers data from API:", response);
      // Check if response is an error
      if ((response as ApiResponse).error) {
        const errorResponse = response as ApiResponse;
        if (errorResponse.details?.msg === "Token expired") {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        setTeachers([]);
        return;
      }
      // If not error, it's an array of teachers
      setTeachers(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message?: string }).message === "string" &&
        ((error as { message?: string }).message?.includes("Token expired") ||
          (error as { message?: string }).message?.includes("401"))
      ) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }
      setTeachers([]);
    }
  }, [router]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      openSidebar();
    }
  }, [openSidebar]);

  const handleOpenModal = (teacher?: BackendTeacher) => {
    setShowModal(true);
    setFormError(null);
    if (teacher) {
      setEditId(teacher.id);
      setForm({
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        email: teacher.email,
        trialRate:
          teacher.rates?.find((r: TeacherRate) => r.class_type_id === 1)
            ?.rate || "",
        regularRate:
          teacher.rates?.find((r: TeacherRate) => r.class_type_id === 2)
            ?.rate || "",
        trainingRate:
          teacher.rates?.find((r: TeacherRate) => r.class_type_id === 3)
            ?.rate || "",
        password: "",
      });
    } else {
      setEditId(null);
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        trialRate: "",
        regularRate: "",
        trainingRate: "",
        password: "",
      });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormError(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddOrEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.first_name ||
      !form.last_name ||
      !form.email ||
      !form.trialRate ||
      !form.regularRate ||
      !form.trainingRate ||
      (!editId && !form.password)
    ) {
      setFormError("Please fill in all fields");
      return;
    }
    try {
      let teacherId = editId;
      if (!editId) {
        // Create
        const res = await fetch("/api/proxy/teachers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            password: form.password,
          }),
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        if (!res.ok) throw new Error("Failed to create teacher");
        const teacher = await res.json();
        teacherId = teacher.id;
      } else {
        // Update
        const res = await fetch(`/api/proxy/teachers/${editId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
          }),
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        if (!res.ok) throw new Error("Failed to update teacher");
      }
      // Set rates
      const rates = [
        { class_type_id: 1, rate: form.trialRate },
        { class_type_id: 2, rate: form.regularRate },
        { class_type_id: 3, rate: form.trainingRate },
      ];

      const ratesRes = await fetch(`/api/proxy/teachers/${teacherId}/rates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ rates }),
      });

      if (ratesRes.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      if (!ratesRes.ok) throw new Error("Failed to set rates");
      setShowModal(false);
      setEditId(null);
      fetchTeachers();
    } catch (error) {
      console.error("Error saving teacher:", error);
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message?: string }).message === "string" &&
        ((error as { message?: string }).message?.includes("Token expired") ||
          (error as { message?: string }).message?.includes("401"))
      ) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }
      setFormError("Failed to save teacher");
    }
  };

  const handleDeleteTeacher = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/proxy/teachers/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to delete teacher");
      setDeleteId(null);
      fetchTeachers();
    } catch {
      alert("Failed to delete teacher");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Teachers</h1>
        <button className={styles.addButton} onClick={() => handleOpenModal()}>
          <span>Add Teacher</span>
        </button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Trial Rate</th>
            <th>Regular Rate</th>
            <th>Training Rate</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher) => {
            console.log("Teacher rates:", teacher.rates);
            return (
              <tr key={teacher.id}>
                <td>
                  {teacher.first_name} {teacher.last_name}
                </td>
                <td>{teacher.email}</td>
                <td>
                  {(() => {
                    const rate = teacher.rates?.find(
                      (r: TeacherRate) => r.class_type_id === 1
                    );
                    console.log("Trial rate:", rate);
                    return rate?.rate || "-";
                  })()}
                </td>
                <td>
                  {(() => {
                    const rate = teacher.rates?.find(
                      (r: TeacherRate) => r.class_type_id === 2
                    );
                    console.log("Regular rate:", rate);
                    return rate?.rate || "-";
                  })()}
                </td>
                <td>
                  {(() => {
                    const rate = teacher.rates?.find(
                      (r: TeacherRate) => r.class_type_id === 3
                    );
                    console.log("Training rate:", rate);
                    return rate?.rate || "-";
                  })()}
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.editButton}
                      onClick={() => handleOpenModal(teacher)}
                    >
                      ✎
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => setDeleteId(teacher.id)}
                    >
                      ×
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.closeButton} onClick={handleCloseModal}>
              ×
            </button>
            <h2 className={styles.modalTitle}>
              {editId ? "Edit Teacher" : "Add New Teacher"}
            </h2>
            <form className={styles.form} onSubmit={handleAddOrEditTeacher}>
              <div className={styles.formGroup}>
                <label className={styles.label}>First Name</label>
                <input
                  type="text"
                  className={styles.input}
                  name="first_name"
                  value={form.first_name}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Last Name</label>
                <input
                  type="text"
                  className={styles.input}
                  name="last_name"
                  value={form.last_name}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  className={styles.input}
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  required
                />
              </div>
              {!editId && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Password</label>
                  <input
                    type="password"
                    className={styles.input}
                    name="password"
                    value={form.password}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              )}
              <div className={styles.formGroup}>
                <label className={styles.label}>Trial Rate</label>
                <input
                  type="number"
                  className={styles.input}
                  name="trialRate"
                  value={form.trialRate}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Regular Rate</label>
                <input
                  type="number"
                  className={styles.input}
                  name="regularRate"
                  value={form.regularRate}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Training Rate</label>
                <input
                  type="number"
                  className={styles.input}
                  name="trainingRate"
                  value={form.trainingRate}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              {formError && <div className={styles.formError}>{formError}</div>}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={`${styles.button} ${styles.secondaryButton}`}
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.button} ${styles.primaryButton}`}
                >
                  {editId ? "Save Changes" : "Add Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Delete Teacher</h2>
            <p>Are you sure you want to delete this teacher?</p>
            <div className={styles.modalActions}>
              <button
                className={`${styles.button} ${styles.primaryButton}`}
                onClick={handleDeleteTeacher}
              >
                Delete
              </button>
              <button
                className={`${styles.button} ${styles.secondaryButton}`}
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
