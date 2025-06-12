import React, { useState } from "react";
import { calendarApi } from "@/app/api/calendar";

interface LessonStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: number;
  currentStatus: string;
  onStatusUpdate: (id: number, status: string) => void;
}

export default function LessonStatusModal({
  isOpen,
  onClose,
  lessonId,
  currentStatus,
  onStatusUpdate,
}: LessonStatusModalProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await calendarApi.updateLessonStatus(lessonId, status);
      onStatusUpdate(lessonId, status);
      onClose();
    } catch {
      setError("Failed to update lesson status");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Update Lesson Status</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
            >
              <option value="completed">Проведено</option>
              <option value="cancelled">Скасовано</option>
              <option value="no_show">Студент не з&apos;явився</option>
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
