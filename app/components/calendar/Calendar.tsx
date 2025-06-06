"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarApi, EventDropArg, DateSelectArg } from "@fullcalendar/core";
import { Lesson, teachers, testLessons } from "./types";
import TeacherSelector from "./TeacherSelector";
import CalendarStyles from "./CalendarStyles";

export default function Calendar() {
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>(testLessons);
  const [calendarApi, setCalendarApi] = useState<CalendarApi | null>(null);

  const handleSelect = useCallback(
    (selectInfo: DateSelectArg) => {
      const title = prompt("Please enter a title for your lesson:");
      if (title) {
        const newLesson: Lesson = {
          id: String(Date.now()),
          title,
          start: selectInfo.start,
          end: selectInfo.end,
          teacherId: selectedTeachers[0] || teachers[0].id,
          teacherName: teachers.find((t) => t.id === (selectedTeachers[0] || teachers[0].id))?.name || "",
          color: teachers.find((t) => t.id === (selectedTeachers[0] || teachers[0].id))?.color || "#3788d8",
        };
        setLessons((prev) => [...prev, newLesson]);
      }
    },
    [selectedTeachers]
  );

  const handleEventDrop = useCallback((dropInfo: EventDropArg) => {
    const { event } = dropInfo;
    if (!event.start || !event.end) return;

    setLessons((prev) =>
      prev.map((lesson) => (lesson.id === event.id ? { ...lesson, start: event.start!, end: event.end! } : lesson))
    );
  }, []);

  const processedEvents = useMemo(() => {
    return lessons
      .filter((lesson) => selectedTeachers.includes(lesson.teacherId))
      .map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        start: lesson.start,
        end: lesson.end,
        backgroundColor: lesson.color,
        borderColor: lesson.color,
        extendedProps: {
          teacherName: lesson.teacherName,
          timeRange: `${lesson.start.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })} - ${lesson.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        },
      }));
  }, [lessons, selectedTeachers]);

  useEffect(() => {
    const adjustColumnWidths = () => {
      const columns = document.querySelectorAll(".fc-timegrid-col");

      columns.forEach((column) => {
        const date = column.getAttribute("data-date");
        if (!date) return;

        const events = column.querySelectorAll(".fc-timegrid-event");
        const timeSlots = new Map();

        // Group events by time slot
        events.forEach((event) => {
          const start = event.getAttribute("data-start");
          if (!start) return;

          if (!timeSlots.has(start)) {
            timeSlots.set(start, []);
          }
          timeSlots.get(start).push(event);
        });

        // Find the maximum number of overlapping events
        let maxOverlap = 1;
        timeSlots.forEach((events) => {
          maxOverlap = Math.max(maxOverlap, events.length);
        });

        // Calculate new width based on overlap
        const baseWidth = 200;
        const widthPerEvent = 100;
        const newWidth = maxOverlap > 2 ? baseWidth + (maxOverlap - 2) * widthPerEvent : baseWidth;

        // Apply width to both header and content
        const headerCell = document.querySelector(`th[data-date="${date}"]`) as HTMLElement;
        if (headerCell) {
          headerCell.style.width = `${newWidth}px`;
          headerCell.style.minWidth = `${newWidth}px`;
          headerCell.style.maxWidth = `${newWidth}px`;
        }

        const columnElement = column as HTMLElement;
        columnElement.style.width = `${newWidth}px`;
        columnElement.style.minWidth = `${newWidth}px`;
        columnElement.style.maxWidth = `${newWidth}px`;

        // Adjust event widths and spacing
        const columnEvents = column.querySelectorAll(".fc-timegrid-event");
        columnEvents.forEach((event) => {
          const eventElement = event as HTMLElement;
          eventElement.style.width = `calc(100% - 4px)`;
          eventElement.style.margin = "1px 2px";
        });
      });
    };

    // Initial adjustment
    if (calendarApi) {
      adjustColumnWidths();
    }

    // Add event listeners
    if (calendarApi) {
      const handleEvent = () => adjustColumnWidths();

      calendarApi.on("eventChange", handleEvent);
      calendarApi.on("eventAdd", handleEvent);
      calendarApi.on("eventRemove", handleEvent);
      calendarApi.on("datesSet", handleEvent);

      // Also adjust on window resize
      window.addEventListener("resize", adjustColumnWidths);

      return () => {
        calendarApi.off("eventChange", handleEvent);
        calendarApi.off("eventAdd", handleEvent);
        calendarApi.off("eventRemove", handleEvent);
        calendarApi.off("datesSet", handleEvent);
        window.removeEventListener("resize", adjustColumnWidths);
      };
    }
  }, [calendarApi]);

  useEffect(() => {
    // Wait for FullCalendar to render
    const adjustDayColumnWidths = () => {
      // Select all day columns (skip the time axis column)
      const columns = document.querySelectorAll(".fc-timegrid-col:not(.fc-timegrid-axis)");
      columns.forEach((column) => {
        // Find all events in this column
        const events = column.querySelectorAll(".fc-timegrid-event");
        // Find the maximum number of overlapping events in any slot
        const timeSlots = new Map();
        events.forEach((event) => {
          const start = event.getAttribute("data-start");
          if (!start) return;
          if (!timeSlots.has(start)) timeSlots.set(start, []);
          timeSlots.get(start).push(event);
        });
        let maxOverlap = 1;
        timeSlots.forEach((evts) => {
          maxOverlap = Math.max(maxOverlap, evts.length);
        });
        // Set min-width based on overlap
        const baseWidth = 200;
        const widthPerEvent = 60;
        const newWidth = maxOverlap > 2 ? baseWidth + (maxOverlap - 2) * widthPerEvent : baseWidth;
        const colEl = column as HTMLElement;
        colEl.style.minWidth = `${newWidth}px`;
        colEl.style.width = `${newWidth}px`;
        colEl.style.maxWidth = `${newWidth}px`;
        // Also set the header cell width
        const date = column.getAttribute("data-date");
        if (date) {
          const headerCell = document.querySelector(`th[data-date="${date}"]`) as HTMLElement;
          if (headerCell) {
            headerCell.style.minWidth = `${newWidth}px`;
            headerCell.style.width = `${newWidth}px`;
            headerCell.style.maxWidth = `${newWidth}px`;
          }
        }
      });
    };
    // Run after a short delay to ensure DOM is ready
    setTimeout(adjustDayColumnWidths, 50);
    // Optionally, rerun on window resize
    window.addEventListener("resize", adjustDayColumnWidths);
    return () => {
      window.removeEventListener("resize", adjustDayColumnWidths);
    };
  }, [processedEvents]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeacherSelector
          teachers={teachers}
          selectedTeachers={selectedTeachers}
          onTeacherSelect={setSelectedTeachers}
        />

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="h-[calc(100vh-250px)] overflow-x-auto">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
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
                            <div class="fc-event-teacher">${extendedProps.teacherName}</div>
                            <div class="fc-event-time">${extendedProps.timeRange}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  `,
                };
              }}
              ref={(el) => {
                if (el) {
                  setCalendarApi(el.getApi());
                }
              }}
            />
          </div>
        </div>
      </div>
      <CalendarStyles />
    </div>
  );
}
