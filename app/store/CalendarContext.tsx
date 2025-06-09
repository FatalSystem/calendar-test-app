// app/store/CalendarContext.tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import { Event, BackendTeacher } from "../components/calendar/types";
import { calendarApi } from "../api/calendar";

const TEACHER_COLORS = [
  "#3174ad",
  "#2ecc71",
  "#e74c3c",
  "#f1c40f",
  "#9b59b6",
  "#1abc9c",
  "#e67e22",
  "#34495e",
  "#16a085",
  "#c0392b",
];

interface TeacherWithColor extends BackendTeacher {
  color: string;
}

interface CalendarContextProps {
  events: Event[];
  teachers: TeacherWithColor[];
  selectedTeachers: string[];
  isLoading: boolean;
  error: string | null;
  setEvents: (events: Event[]) => void;
  setTeachers: (teachers: BackendTeacher[]) => void;
  setSelectedTeachers: (teacherIds: string[]) => void;
  addEvent: (event: Event) => void;
  updateEvent: (eventId: number, updatedEvent: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: number) => void;
  fetchEvents: () => Promise<void>;
  fetchTeachers: () => Promise<void>;
  getTeacherColor: (teacherId: number) => string;
}

const CalendarContext = createContext<CalendarContextProps | undefined>(
  undefined
);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [events, setEventsState] = useState<Event[]>([]);
  const [teachers, setTeachersState] = useState<TeacherWithColor[]>([]);
  const [selectedTeachers, setSelectedTeachersState] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setEvents = (events: Event[]) => setEventsState(events);

  const setTeachers = (teachers: BackendTeacher[]) => {
    setTeachersState(
      teachers.map((teacher, index) => ({
        ...teacher,
        color: TEACHER_COLORS[index % TEACHER_COLORS.length],
      }))
    );
  };

  const setSelectedTeachers = (teacherIds: string[]) =>
    setSelectedTeachersState(teacherIds);

  const addEvent = (event: Event) => setEventsState((prev) => [...prev, event]);

  const updateEvent = useCallback(
    async (eventId: number, updatedEvent: Partial<Event>) => {
      setEventsState((prev) =>
        prev.map((event) =>
          event.id === eventId ? { ...event, ...updatedEvent } : event
        )
      );

      try {
        if (updatedEvent.resourceId) {
          await calendarApi.updateEvent(updatedEvent.resourceId, {
            lesson_id: eventId,
          });
        }
      } catch (error) {
        console.error("Error updating event:", error);
      }
    },
    []
  );

  const deleteEvent = (eventId: number) => {
    setEventsState((prev) => prev.filter((event) => event.id !== eventId));
  };

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await calendarApi.getAllEvents();
      if (response.events?.rows) {
        setEvents(response.events.rows);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch events"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const teachers = await calendarApi.getTeachers();
      setTeachers(teachers);
      if (selectedTeachers.length === 0 && teachers.length > 0) {
        setSelectedTeachersState((prev) => {
          if (prev.length === 0) {
            return teachers.map((t: { id: number }) => String(t.id));
          }
          return prev;
        });
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch teachers"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTeacherColor = (teacherId: number) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher?.color || TEACHER_COLORS[0];
  };

  return (
    <CalendarContext.Provider
      value={{
        events,
        teachers,
        selectedTeachers,
        isLoading,
        error,
        setEvents,
        setTeachers,
        setSelectedTeachers,
        addEvent,
        updateEvent,
        deleteEvent,
        fetchEvents,
        fetchTeachers,
        getTeacherColor,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendarContext = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error(
      "useCalendarContext must be used within a CalendarProvider"
    );
  }
  return context;
};
