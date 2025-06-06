import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface BackendLesson {
  id: number;
  calendar_id: number;
  lesson_date: string;
  student_id: number;
  teacher_id: number;
  class_type_id: number;
  class_status: string;
  start_time: string;
  end_time: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendTeacher {
  id: number;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const calendarApi = {
  // Get all calendar events
  getAllEvents: async () => {
    const response = await axios.get(`${API_BASE_URL}/calendar/events`);
    return response.data;
  },

  // Save new event
  saveEvent: async (event: Omit<BackendLesson, "id" | "createdAt" | "updatedAt">) => {
    const response = await axios.post(`${API_BASE_URL}/calendar/events`, event);
    return response.data;
  },

  // Update event
  updateEvent: async (id: number, event: Partial<BackendLesson>) => {
    const response = await axios.put(`${API_BASE_URL}/calendar/events/${id}`, event);
    return response.data;
  },

  // Delete event
  deleteEvent: async (id: number) => {
    const response = await axios.delete(`${API_BASE_URL}/calendar/events/${id}`);
    return response.data;
  },

  // Get lesson by calendar ID
  getLessonByCalendarId: async (id: number) => {
    const response = await axios.get(`${API_BASE_URL}/calendar/events/${id}/lesson`);
    return response.data;
  },

  // Get all teachers
  getAllTeachers: async () => {
    const response = await axios.get(`${API_BASE_URL}/teachers`);
    return response.data;
  },
};

// Helper function to convert backend lesson to frontend lesson format
export const convertBackendLessonToFrontend = (backendLesson: BackendLesson) => {
  const startDate = new Date(`${backendLesson.lesson_date}T${backendLesson.start_time}`);
  const endDate = new Date(`${backendLesson.lesson_date}T${backendLesson.end_time}`);

  return {
    id: backendLesson.id.toString(),
    title: `Lesson ${backendLesson.id}`, // You might want to get the actual title from class_type
    start: startDate,
    end: endDate,
    teacherId: backendLesson.teacher_id.toString(),
    teacherName: "", // This should be populated from the teacher data
    color: "#3174ad", // This should be configured based on teacher or class type
  };
};
