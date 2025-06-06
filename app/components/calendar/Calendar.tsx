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
    const adjustDayColumnWidths = () => {
      const columns = document.querySelectorAll(".fc-timegrid-col[data-date]");
      columns.forEach((column) => {
        const columnElement = column as HTMLElement;
        const events = columnElement.querySelectorAll(".fc-timegrid-event");

        // Calculate max overlapping events
        const eventRanges = Array.from(events).map((event) => {
          const timeElement = event.querySelector(".fc-event-time");
          const timeRange = timeElement?.textContent || "";
          const [start, end] = timeRange.split(" - ").map((time) => {
            const [hours, minutes] = time.split(":").map(Number);
            return hours * 60 + minutes; // Convert to minutes for easier comparison
          });
          return { start, end, event };
        });

        // Find maximum overlap
        let maxOverlap = 1;
        for (let i = 0; i < eventRanges.length; i++) {
          let currentOverlap = 1;
          for (let j = 0; j < eventRanges.length; j++) {
            if (i === j) continue;
            // Check if events overlap
            if (eventRanges[i].start < eventRanges[j].end && eventRanges[i].end > eventRanges[j].start) {
              currentOverlap++;
            }
          }
          maxOverlap = Math.max(maxOverlap, currentOverlap);
        }

        console.log("Event ranges:", eventRanges);
        console.log("Max overlap:", maxOverlap);

        // Default width
        const defaultWidth = 120;
        // Only expand if more than 2 overlapping events
        const expandedWidth = maxOverlap > 1 ? defaultWidth + (maxOverlap - 2) * 60 : defaultWidth;

        columnElement.style.minWidth = `${expandedWidth}px`;
        columnElement.style.width = `${expandedWidth}px`;
        columnElement.style.maxWidth = `400px`;

        // Also set the header cell width
        const date = columnElement.getAttribute("data-date");
        if (date) {
          const headerCell = document.querySelector(`th[data-date=\"${date}\"]`) as HTMLElement;
          if (headerCell) {
            headerCell.style.minWidth = `${expandedWidth}px`;
            headerCell.style.width = `${expandedWidth}px`;
            headerCell.style.maxWidth = `400px`;
          }
        }
      });
    };
    setTimeout(adjustDayColumnWidths, 50);
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
