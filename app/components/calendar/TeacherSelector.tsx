"use client";

interface TeacherSelectorProps {
  teachers: {
    id: string;
    name: string;
    color: string;
  }[];
  selectedTeachers: string[];
  onTeacherSelect: (teacherIds: string[]) => void;
  singleSelect?: boolean;
}

export default function TeacherSelector({
  teachers,
  selectedTeachers,
  onTeacherSelect,
  singleSelect = false,
}: TeacherSelectorProps) {
  const toggleTeacher = (teacherId: string) => {
    if (singleSelect) {
      onTeacherSelect([teacherId]);
    } else {
      if (selectedTeachers.includes(teacherId)) {
        onTeacherSelect(selectedTeachers.filter((id) => id !== teacherId));
      } else {
        onTeacherSelect([...selectedTeachers, teacherId]);
      }
    }
  };

  return (
    <div className="teacher-selector">
      {!singleSelect && (
        <button
          className={`teacher-button all-teachers-btn${
            selectedTeachers.length === teachers.length ? " selected" : ""
          }`}
          onClick={() => {
            if (selectedTeachers.length === teachers.length) {
              onTeacherSelect([]);
            } else {
              onTeacherSelect(teachers.map((t) => t.id));
            }
          }}
          style={{
            backgroundColor:
              selectedTeachers.length === teachers.length ? "#2563eb" : "white",
            color:
              selectedTeachers.length === teachers.length ? "white" : "inherit",
            border:
              selectedTeachers.length === teachers.length
                ? `2px solid #2563eb`
                : "2px solid transparent",
            fontWeight: 600,
          }}
        >
          <div
            className="teacher-color"
            style={{ backgroundColor: "#2563eb" }}
          />
          All Teachers
        </button>
      )}
      {teachers.map((teacher) => (
        <button
          key={teacher.id}
          className={`teacher-button ${
            selectedTeachers.includes(teacher.id) ? "selected" : ""
          }`}
          onClick={() => toggleTeacher(teacher.id)}
          style={{
            backgroundColor: selectedTeachers.includes(teacher.id)
              ? teacher.color
              : "white",
            color: selectedTeachers.includes(teacher.id) ? "white" : "inherit",
            border: selectedTeachers.includes(teacher.id)
              ? `2px solid ${teacher.color}`
              : "2px solid transparent",
            transition: "all 0.2s ease",
          }}
        >
          <div
            className="teacher-color"
            style={{ backgroundColor: teacher.color }}
          />
          {teacher.name}
        </button>
      ))}
    </div>
  );
}
