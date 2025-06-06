import { create } from "zustand";
import { Event, BackendTeacher } from "../components/calendar/types";
import { calendarApi } from "../api/calendar";

// Predefined colors for teachers
const TEACHER_COLORS = [
  "#3174ad", // Default blue
  "#2ecc71", // Green
  "#e74c3c", // Red
  "#f1c40f", // Yellow
  "#9b59b6", // Purple
  "#1abc9c", // Turquoise
  "#e67e22", // Orange
  "#34495e", // Dark blue
  "#16a085", // Dark turquoise
  "#c0392b", // Dark red
];

interface TeacherWithColor extends BackendTeacher {
  color: string;
}

interface CalendarState {
  events: Event[];
  teachers: TeacherWithColor[];
  selectedTeachers: string[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setEvents: (events: Event[]) => void;
  setTeachers: (teachers: BackendTeacher[]) => void;
  setSelectedTeachers: (teacherIds: string[]) => void;
  addEvent: (event: Event) => void;
  updateEvent: (eventId: number, updatedEvent: Partial<Event>) => void;
  deleteEvent: (eventId: number) => void;
  fetchEvents: () => Promise<void>;
  fetchTeachers: () => Promise<void>;
  getTeacherColor: (teacherId: number) => string;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  teachers: [],
  selectedTeachers: [],
  isLoading: false,
  error: null,

  setEvents: (events) => set({ events }),
  setTeachers: (teachers) =>
    set({
      teachers: teachers.map((teacher: BackendTeacher, index: number) => ({
        ...teacher,
        color: TEACHER_COLORS[index % TEACHER_COLORS.length],
      })),
    }),
  setSelectedTeachers: (teacherIds) => set({ selectedTeachers: teacherIds }),

  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),

  updateEvent: async (eventId, updatedEvent) => {
    // Optimistically update the UI
    set((state) => ({
      events: state.events.map((event) => (event.id === eventId ? { ...event, ...updatedEvent } : event)),
    }));

    try {
      // Get the event being updated
      const event = get().events.find((e) => e.id === eventId);

      if (event?.resourceId) {
        // Call the API to update the event
        await calendarApi.updateEvent(event.resourceId, {
          lesson_id: eventId,
        });
      }
    } catch (error) {
      // Revert the optimistic update on error
      set((state) => ({
        events: state.events.map((event) => (event.id === eventId ? event : event)),
      }));
      console.error("Error updating event:", error);
    }
  },

  deleteEvent: (eventId) =>
    set((state) => ({
      events: state.events.filter((event) => event.id !== eventId),
    })),

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await calendarApi.getAllEvents();
      if (response.events?.rows) {
        set({ events: response.events.rows });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch events" });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTeachers: async () => {
    set({ isLoading: true, error: null });
    try {
      const teachers = await calendarApi.getTeachers();
      set({
        teachers: teachers.map((teacher: BackendTeacher, index: number) => ({
          ...teacher,
          color: TEACHER_COLORS[index % TEACHER_COLORS.length],
        })),
      });
      // Set initial selected teachers if none are selected
      if (get().selectedTeachers.length === 0 && teachers.length > 0) {
        set({ selectedTeachers: teachers.map((t: BackendTeacher) => String(t.id)) });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch teachers" });
    } finally {
      set({ isLoading: false });
    }
  },

  getTeacherColor: (teacherId: number) => {
    const teacher = get().teachers.find((t) => t.id === teacherId);
    return teacher?.color || TEACHER_COLORS[0];
  },
}));
