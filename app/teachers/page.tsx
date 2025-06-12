"use client";
import React, { useEffect, useState } from "react";
import { calendarApi, BackendTeacher } from "../api/calendar";
import "../classes/ClassesPage.css";
import "../teachers/TeachersPage.css";
import { useSidebar } from "../store/SidebarContext";
import styles from "./TeachersPage.module.css";

interface TeacherForm {
  first_name: string;
  last_name: string;
  email: string;
  trialRate: string;
  regularRate: string;
  trainingRate: string;
}

export default function TeachersPage() {
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
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { openSidebar } = useSidebar();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      openSidebar();
    }
  }, [openSidebar]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const data = await calendarApi.getTeachers();
      setTeachers(data);
    } catch {
      // Handle error silently or show a notification
    }
  };

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
          teacher.TeacherRates?.find(
            (r) => r.class_type?.name === "Trial-Lesson"
          )?.rate || "",
        regularRate:
          teacher.TeacherRates?.find(
            (r) => r.class_type?.name === "Regular-Lesson"
          )?.rate || "",
        trainingRate:
          teacher.TeacherRates?.find((r) => r.class_type?.name === "Training")
            ?.rate || "",
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
      !form.trainingRate
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
          }),
        });
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
        if (!res.ok) throw new Error("Failed to update teacher");
      }
      // Set rates
      const ratesRes = await fetch(`/api/proxy/teachers/${teacherId}/rates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          rates: [
            { class_type: "Trial-Lesson", rate: form.trialRate },
            { class_type: "Regular-Lesson", rate: form.regularRate },
            { class_type: "Training", rate: form.trainingRate },
          ],
        }),
      });
      if (!ratesRes.ok) throw new Error("Failed to set rates");
      setShowModal(false);
      setEditId(null);
      fetchTeachers();
    } catch {
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
          {teachers.map((teacher) => (
            <tr key={teacher.id}>
              <td>
                {teacher.first_name} {teacher.last_name}
              </td>
              <td>{teacher.email}</td>
              <td>
                {teacher.TeacherRates?.find(
                  (r) => r.class_type?.name === "Trial-Lesson"
                )?.rate || "-"}
              </td>
              <td>
                {teacher.TeacherRates?.find(
                  (r) => r.class_type?.name === "Regular-Lesson"
                )?.rate || "-"}
              </td>
              <td>
                {teacher.TeacherRates?.find(
                  (r) => r.class_type?.name === "Training"
                )?.rate || "-"}
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
          ))}
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
