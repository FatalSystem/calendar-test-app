import { BackendLesson, BackendTeacher } from "@/app/api/calendar";

export interface Lesson {
  id: string;
  title: string;
  start: Date;
  end: Date;
  teacherId: string;
  description?: string;
  teacherName: string;
  color: string;
}

export interface Teacher {
  id: string;
  name: string;
  color: string;
}

export const teachers: Teacher[] = [
  { id: "1", name: "John Doe", color: "#3174ad" },
  { id: "2", name: "Jane Smith", color: "#ad3131" },
  { id: "3", name: "Mike Johnson", color: "#31ad31" },
];

export const createDate = (daysToAdd: number, hours: number, minutes: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const testLessons: Lesson[] = [
  {
    id: "1",
    title: "Math",
    start: createDate(0, 9, 0),
    end: createDate(0, 10, 30),
    teacherId: "1",
    teacherName: "John Doe",
    color: "#3174ad",
  },
  {
    id: "2",
    title: "English",
    start: createDate(0, 9, 0),
    end: createDate(0, 10, 30),
    teacherId: "2",
    teacherName: "Jane Smith",
    color: "#ad3131",
  },
  {
    id: "3",
    title: "Science",
    start: createDate(0, 11, 0),
    end: createDate(0, 12, 30),
    teacherId: "3",
    teacherName: "Mike Johnson",
    color: "#31ad31",
  },
  {
    id: "4",
    title: "History",
    start: createDate(0, 13, 0),
    end: createDate(0, 14, 30),
    teacherId: "1",
    teacherName: "John Doe",
    color: "#3174ad",
  },
  {
    id: "5",
    title: "Art",
    start: createDate(0, 13, 0),
    end: createDate(0, 14, 30),
    teacherId: "2",
    teacherName: "Jane Smith",
    color: "#ad3131",
  },
  {
    id: "6",
    title: "Physics",
    start: createDate(1, 9, 0),
    end: createDate(1, 10, 30),
    teacherId: "3",
    teacherName: "Mike Johnson",
    color: "#31ad31",
  },
  {
    id: "7",
    title: "Chemistry",
    start: createDate(1, 9, 0),
    end: createDate(1, 10, 30),
    teacherId: "1",
    teacherName: "John Doe",
    color: "#3174ad",
  },
  {
    id: "8",
    title: "Biology",
    start: createDate(1, 11, 0),
    end: createDate(1, 12, 30),
    teacherId: "2",
    teacherName: "Jane Smith",
    color: "#ad3131",
  },
  {
    id: "9",
    title: "Music",
    start: createDate(1, 13, 0),
    end: createDate(1, 14, 30),
    teacherId: "3",
    teacherName: "Mike Johnson",
    color: "#31ad31",
  },
  {
    id: "10",
    title: "Dance",
    start: createDate(1, 13, 0),
    end: createDate(1, 14, 30),
    teacherId: "1",
    teacherName: "John Doe",
    color: "#3174ad",
  },
  {
    id: "11",
    title: "Computer Science",
    start: createDate(2, 9, 0),
    end: createDate(2, 10, 30),
    teacherId: "2",
    teacherName: "Jane Smith",
    color: "#ad3131",
  },
  {
    id: "12",
    title: "Programming",
    start: createDate(2, 9, 0),
    end: createDate(2, 10, 30),
    teacherId: "3",
    teacherName: "Mike Johnson",
    color: "#31ad31",
  },
  {
    id: "13",
    title: "Web Development",
    start: createDate(2, 11, 0),
    end: createDate(2, 12, 30),
    teacherId: "1",
    teacherName: "John Doe",
    color: "#3174ad",
  },
  {
    id: "14",
    title: "Database Design",
    start: createDate(2, 13, 0),
    end: createDate(2, 14, 30),
    teacherId: "2",
    teacherName: "Jane Smith",
    color: "#ad3131",
  },
  {
    id: "15",
    title: "UI/UX Design",
    start: createDate(2, 13, 0),
    end: createDate(2, 14, 30),
    teacherId: "3",
    teacherName: "Mike Johnson",
    color: "#31ad31",
  },
];

// Helper function to convert backend teacher to frontend teacher format
export const convertBackendTeacherToFrontend = (backendTeacher: BackendTeacher): Teacher => {
  return {
    id: backendTeacher.id.toString(),
    name: backendTeacher.name,
    color: "#3174ad", // You might want to configure this based on teacher preferences
  };
};

// Helper function to convert frontend lesson to backend lesson format
export const convertFrontendLessonToBackend = (
  lesson: Lesson
): Omit<BackendLesson, "id" | "createdAt" | "updatedAt"> => {
  return {
    calendar_id: 1, // You'll need to set this based on your calendar structure
    lesson_date: lesson.start.toISOString().split("T")[0],
    student_id: 1, // You'll need to set this based on your student structure
    teacher_id: parseInt(lesson.teacherId),
    class_type_id: 1, // You'll need to set this based on your class type structure
    class_status: "scheduled",
    start_time: lesson.start.toTimeString().split(" ")[0],
    end_time: lesson.end.toTimeString().split(" ")[0],
  };
};
