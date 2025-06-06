"use client";

import { Teacher } from "./types";

interface TeacherSelectorProps {
  teachers: Teacher[];
  selectedTeachers: string[];
  onTeacherSelect: (teacherIds: string[]) => void;
}

export default function TeacherSelector({ teachers, selectedTeachers, onTeacherSelect }: TeacherSelectorProps) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3 text-black">Select Teachers</h2>
      <div className="flex flex-wrap gap-2">
        {teachers.map((teacher) => (
          <button
            key={teacher.id}
            onClick={() => {
              if (selectedTeachers.includes(teacher.id)) {
                onTeacherSelect(selectedTeachers.filter((id) => id !== teacher.id));
              } else {
                onTeacherSelect([...selectedTeachers, teacher.id]);
              }
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedTeachers.includes(teacher.id)
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
            style={{
              border: `2px solid ${teacher.color}`,
            }}
          >
            {teacher.name}
          </button>
        ))}
      </div>
    </div>
  );
}
