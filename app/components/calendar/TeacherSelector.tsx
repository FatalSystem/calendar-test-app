"use client";

interface TeacherSelectorProps {
  teachers: {
    id: string;
    name: string;
    color: string;
  }[];
  selectedTeachers: string[];
  onTeacherSelect: (teacherIds: string[]) => void;
}

export default function TeacherSelector({
  teachers,
  selectedTeachers,
  onTeacherSelect,
}: TeacherSelectorProps) {
  const toggleTeacher = (teacherId: string) => {
    if (selectedTeachers.includes(teacherId)) {
      onTeacherSelect(selectedTeachers.filter((id) => id !== teacherId));
    } else {
      onTeacherSelect([...selectedTeachers, teacherId]);
    }
  };

  return (
    <div className="teacher-selector">
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
