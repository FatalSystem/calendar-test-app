import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  baseURL: "/api/proxy", // Use our proxy instead of direct backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("No authentication token found. Some requests may fail.");
  }
  return config;
});

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
    });

    if (error.response?.status === 401) {
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes("/login")) {
        console.log("Authentication failed, redirecting to login page");
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
}

export interface ClassType {
  id: number;
  name: string;
}

export interface CalendarLink {
  id: number;
  calendar_id: number;
  link: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: number;
  startDate: string;
  endDate: string;
  name: string;
  student_id: number | null;
  teacher_id: number;
  class_type: string;
  class_status: string;
  payment_status: string;
  student_name_text: string;
  calendar_id: number;
  recurrenceRule?: string;
  duration?: number;
  isUnavailable?: boolean;
  teacherColor?: string;
  eventColor?: string;
  createdAt: string | null;
  updatedAt: string | null;
  Student?: Student;
  Teacher?: BackendTeacher;
  class_type_details?: ClassType;
  CalendarLink?: CalendarLink | null;
}

export interface TeacherRate {
  id: number;
  teacher_id: number;
  class_type_id: number;
  rate: string;
  createdAt: string;
  updatedAt: string;
  class_type: {
    name: string;
  };
}

export interface BackendTeacher {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  token: string;
  role_id: number;
  resetToken: string | null;
  resetTokenExpiry: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  TeacherRates: TeacherRate[];
}

export const calendarApi = {
  // Auth endpoints
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    const { token, user } = response.data;
    localStorage.setItem("token", token);
    return { token, user };
  },

  // Calendar endpoints
  getLessons: async () => {
    const response = await api.get("/lessons");
    return response.data;
  },

  getTeachers: async () => {
    const response = await api.get("/teachers");
    return response.data;
  },

  createLesson: async (lesson: Omit<Event, "id" | "createdAt" | "updatedAt">) => {
    const response = await api.post("/lessons", lesson);
    return response.data;
  },

  updateLesson: async (id: number, lesson: Partial<Event>) => {
    const response = await api.put(`/lessons/${id}`, lesson);
    return response.data;
  },

  deleteLesson: async (id: number) => {
    const response = await api.delete(`/lessons/${id}`);
    return response.data;
  },

  // Calendar management endpoints
  createCalendar: async (calendar: {
    class_type: string;
    student_id: number;
    teacher_id: number;
    class_status: string;
    payment_status: string;
    startDate: string;
    endDate: string;
    duration: number;
  }) => {
    const response = await api.post("/calendars", calendar);
    return response.data;
  },

  updateCalendar: async (
    id: number,
    calendar: {
      startDate?: string;
      endDate?: string;
      class_status?: string;
      payment_status?: string;
    }
  ) => {
    const response = await api.put(`/calendars/${id}`, calendar);
    return response.data;
  },

  getAllEvents: async () => {
    const response = await api.get("/calendar/events");
    return response.data;
  },

  updateEvent: async (id: number, data: { lesson_id: number }) => {
    const response = await api.put(`/calendar/events/${id}`, data);
    return response.data;
  },
};

// Helper function to convert backend lesson to frontend lesson format
export const convertBackendLessonToFrontend = (backendLesson: Event) => {
  const startDate = new Date(backendLesson.startDate);
  const endDate = new Date(backendLesson.endDate);

  return {
    id: backendLesson.id.toString(),
    title: backendLesson.name || "Event",
    start: startDate,
    end: endDate,
    teacherId: backendLesson.teacher_id.toString(),
    teacherName: backendLesson.Teacher ? `${backendLesson.Teacher.first_name} ${backendLesson.Teacher.last_name}` : "",
    color: "#3174ad",
  };
};
