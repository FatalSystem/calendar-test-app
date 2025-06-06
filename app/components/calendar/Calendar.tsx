"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { EventDropArg, DateSelectArg, PluginDef } from "@fullcalendar/core";
import { BackendLesson, BackendTeacher } from "./types";
import TeacherSelector from "./TeacherSelector";
import CalendarStyles from "./CalendarStyles";
import { calendarApi } from "@/app/api/calendar";

// Dynamically import FullCalendar with no SSR
const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
  loading: () => <div>Loading calendar...</div>,
});

export default function Calendar() {
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [lessons, setLessons] = useState<BackendLesson[]>([]);
  const [teachers, setTeachers] = useState<BackendTeacher[]>([]);
  const [plugins, setPlugins] = useState<PluginDef[]>([]);

  useEffect(() => {
    const loadPlugins = async () => {
      const [{ default: dayGridPlugin }, { default: timeGridPlugin }, { default: interactionPlugin }] =
        await Promise.all([
          import("@fullcalendar/daygrid"),
          import("@fullcalendar/timegrid"),
          import("@fullcalendar/interaction"),
        ]);
      setPlugins([dayGridPlugin, timeGridPlugin, interactionPlugin]);
    };
    loadPlugins();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [backendLessonsData, backendTeachersData] = await Promise.all([
          calendarApi.getLessons(),
          calendarApi.getTeachers(),
        ]);

        setLessons(backendLessonsData);
        setTeachers(backendTeachersData);

        if (backendTeachersData.length > 0) {
          const teacherIds = backendTeachersData.map((t: BackendTeacher) => String(t.id));
          setSelectedTeachers(teacherIds);
        }
      } catch (error) {
        console.error("Error fetching calendar data:", {
          error: error instanceof Error ? error.message : "Unknown error",
          response:
            error instanceof Error && "response" in error
              ? (error as { response?: { data: unknown } }).response?.data
              : undefined,
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    };

    fetchData();
  }, []);

  const handleSelect = useCallback(
    async (selectInfo: DateSelectArg) => {
      const title = prompt("Please enter a title for your lesson:");
      if (title) {
        const selectedTeacher = teachers.find((t) => t.id === parseInt(selectedTeachers[0] || "0"));

        try {
          const newLesson = await calendarApi.createLesson({
            calendar_id: 0,
            lesson_date: selectInfo.start.toISOString().split("T")[0],
            student_id: 5,
            teacher_id: selectedTeacher?.id || teachers[0]?.id || 0,
            class_type_id: 2,
            class_status: "scheduled",
            start_time: selectInfo.start.toTimeString().split(" ")[0],
            end_time: selectInfo.end.toTimeString().split(" ")[0],
          });

          setLessons((prev) => [...prev, newLesson]);
        } catch (error) {
          console.error("Error creating lesson:", {
            error: error instanceof Error ? error.message : "Unknown error",
            response:
              error instanceof Error && "response" in error
                ? (error as { response?: { data: unknown } }).response?.data
                : undefined,
            stack: error instanceof Error ? error.stack : undefined,
          });
        }
      }
    },
    [selectedTeachers, teachers]
  );

  const handleEventDrop = useCallback(async (dropInfo: EventDropArg) => {
    const { event } = dropInfo;
    if (!event.start || !event.end) return;

    try {
      await calendarApi.updateLesson(parseInt(event.id), {
        lesson_date: event.start.toISOString().split("T")[0],
        start_time: event.start.toTimeString().split(" ")[0],
        end_time: event.end.toTimeString().split(" ")[0],
      });

      setLessons((prev) =>
        prev.map((lesson) =>
          lesson.id === parseInt(event.id)
            ? {
                ...lesson,
                lesson_date: event.start!.toISOString().split("T")[0],
                start_time: event.start!.toTimeString().split(" ")[0],
                end_time: event.end!.toTimeString().split(" ")[0],
              }
            : lesson
        )
      );
    } catch (error) {
      console.error("Error updating lesson:", {
        error: error instanceof Error ? error.message : "Unknown error",
        response:
          error instanceof Error && "response" in error
            ? (error as { response?: { data: unknown } }).response?.data
            : undefined,
        stack: error instanceof Error ? error.stack : undefined,
      });
      dropInfo.revert();
    }
  }, []);

  const processedEvents = useMemo(() => {
    const filteredLessons = lessons.filter((lesson) => selectedTeachers.includes(String(lesson.teacher_id)));

    const events = filteredLessons
      .map((lesson) => {
        const startDate = new Date(`${lesson.lesson_date}T${lesson.start_time}`);
        const endDate = new Date(`${lesson.lesson_date}T${lesson.end_time}`);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return null;
        }

        return {
          id: String(lesson.id),
          title: `${lesson.class_type?.name || "Lesson"} - ${lesson.Student?.first_name || ""} ${
            lesson.Student?.last_name || ""
          }`,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          backgroundColor: "#3174ad",
          borderColor: "#3174ad",
          extendedProps: {
            teacherName: `${lesson.Teacher?.first_name || ""} ${lesson.Teacher?.last_name || ""}`,
            studentName: `${lesson.Student?.first_name || ""} ${lesson.Student?.last_name || ""}`,
            classType: lesson.class_type?.name || "",
            classStatus: lesson.class_status,
            timeRange: `${startDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })} - ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
          },
        };
      })
      .filter((event): event is NonNullable<typeof event> => event !== null);

    return events;
  }, [lessons, selectedTeachers]);

  if (plugins.length === 0) {
    return <div>Loading calendar plugins...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeacherSelector
          teachers={teachers.map((t) => ({
            id: String(t.id),
            name: `${t.first_name} ${t.last_name}`,
            color: "#3174ad",
          }))}
          selectedTeachers={selectedTeachers}
          onTeacherSelect={(ids) => {
            setSelectedTeachers(ids);
          }}
        />

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="h-[calc(100vh-250px)] overflow-x-auto">
            <FullCalendar
              plugins={plugins}
              initialView="timeGridWeek"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              firstDay={1}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              events={processedEvents}
              select={handleSelect}
              eventDrop={handleEventDrop}
              height="100%"
              slotMinTime="06:00:00"
              slotMaxTime="20:00:00"
              allDaySlot={false}
              nowIndicator={true}
              timeZone="local"
              eventTimeFormat={{
                hour: "2-digit",
                minute: "2-digit",
                meridiem: false,
                hour12: false,
              }}
              eventContent={(eventInfo) => {
                const { extendedProps } = eventInfo.event;
                return {
                  html: `
                    <div class="fc-event-main-content">
                      <div class="fc-event-title-container">
                        <div class="fc-event-title fc-sticky">
                          <div class="fc-event-header">
                            ${eventInfo.event.title}
                          </div>
                          <div class="fc-event-details">
                            <div class="fc-event-teacher">Teacher: ${extendedProps.teacherName}</div>
                            <div class="fc-event-student">Student: ${extendedProps.studentName}</div>
                            <div class="fc-event-class">Type: ${extendedProps.classType}</div>
                            <div class="fc-event-status">Status: ${extendedProps.classStatus}</div>
                            <div class="fc-event-time">${extendedProps.timeRange}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  `,
                };
              }}
            />
          </div>
        </div>
      </div>
      <CalendarStyles />
    </div>
  );
}
