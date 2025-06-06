"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { EventDropArg, DateSelectArg, PluginDef } from "@fullcalendar/core";
import { Event, BackendTeacher } from "./types";
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
  const [events, setEvents] = useState<Event[]>([]);
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
        const [eventsData, backendTeachersData] = await Promise.all([
          calendarApi.getAllEvents(),
          calendarApi.getTeachers(),
        ]);

        console.log("API Response:", eventsData);
        console.log("Events from API:", eventsData.events?.rows);
        console.log("Selected Teachers:", selectedTeachers);

        // Set events from the API response
        if (eventsData.events?.rows) {
          setEvents(eventsData.events.rows);
        }

        // Set teachers and update selected teachers
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

  const processedEvents = useMemo(() => {
    console.log("Raw events from state:", events);
    console.log("Selected teachers:", selectedTeachers);

    const filteredEvents = events.filter((event) => {
      const matches = selectedTeachers.includes(event.resourceId);
      console.log("Event filter check:", {
        eventId: event.id,
        teacherId: event.resourceId,
        selectedTeachers,
        matches,
      });
      return matches;
    });

    console.log("Filtered events:", filteredEvents);

    return filteredEvents
      .map((event) => {
        // Format dates for the calendar
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.error("Invalid date detected:", { event, startDate, endDate });
          return null;
        }

        const calendarEvent = {
          id: String(event.id),
          title: event.name || event.class_type || "Event",
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          backgroundColor: event.teacherColor || "#3174ad",
          borderColor: event.teacherColor || "#3174ad",
          extendedProps: {
            teacherName: event.resourceId,
            studentName: event.student_name_text || "",
            classType: event.class_type || "",
            classStatus: event.class_status,
            timeRange: `${startDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })} - ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
          },
        };
        console.log("Processed calendar event:", calendarEvent);
        return calendarEvent;
      })
      .filter((event): event is NonNullable<typeof event> => event !== null);
  }, [events, selectedTeachers]);

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

  console.log("Final processed events:", processedEvents);

  const handleSelect = useCallback(
    async (selectInfo: DateSelectArg) => {
      const title = prompt("Please enter a title for your event:");
      if (title) {
        const selectedTeacher = teachers.find((t) => t.id === parseInt(selectedTeachers[0] || "0"));
        const teacherId = selectedTeacher?.id || teachers[0]?.id || 0;

        // Create optimistic event object
        const optimisticEvent: Event = {
          id: Date.now(), // Temporary ID
          startDate: selectInfo.start.toISOString(),
          endDate: selectInfo.end.toISOString(),
          name: title,
          resourceId: String(teacherId),
          teacherColor: "#3174ad",
          eventColor: "#3174ad",
          class_type: "regular",
          class_status: "scheduled",
          payment_status: "unpaid",
          duration: 50,
          isUnavailable: false,
          student_name: "5",
          student_name_text: "Student Name",
          calendar_id: 0,
          student_id: 5,
        };

        // Optimistically update the UI
        setEvents((prev) => [...prev, optimisticEvent]);

        try {
          // Format dates in UTC to match backend's dayjs format
          const startDate = new Date(selectInfo.start.getTime() - selectInfo.start.getTimezoneOffset() * 60000);
          const endDate = new Date(selectInfo.end.getTime() - selectInfo.end.getTimezoneOffset() * 60000);

          // Create the calendar entry
          const calendarResponse = await calendarApi.createCalendar({
            class_type: title,
            student_id: 5,
            teacher_id: teacherId,
            class_status: "scheduled",
            payment_status: "unpaid",
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            duration: 50,
          });

          // Replace optimistic event with real one
          setEvents((prev) => prev.map((event) => (event.id === optimisticEvent.id ? calendarResponse : event)));
        } catch (error) {
          // Revert optimistic update on error
          setEvents((prev) => prev.filter((event) => event.id !== optimisticEvent.id));
          console.error("Error creating event:", {
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

  const handleEventDrop = useCallback(
    async (dropInfo: EventDropArg) => {
      const { event } = dropInfo;
      if (!event.start || !event.end) return;

      // Store original event for potential revert
      const originalEvent = events.find((e) => e.id === parseInt(event.id));
      if (!originalEvent) return;

      // Create optimistic update
      const optimisticEvent = {
        ...originalEvent,
        startDate: event.start.toISOString(),
        endDate: event.end.toISOString(),
      };

      // Optimistically update the UI
      setEvents((prev) => prev.map((e) => (e.id === parseInt(event.id) ? optimisticEvent : e)));

      try {
        // Update the calendar event
        if (originalEvent.calendar_id) {
          await calendarApi.updateEvent(originalEvent.calendar_id, {
            lesson_id: originalEvent.id,
          });
        }
      } catch (error) {
        // Revert optimistic update on error
        setEvents((prev) => prev.map((e) => (e.id === parseInt(event.id) ? originalEvent : e)));
        dropInfo.revert();
        console.error("Error updating event:", {
          error: error instanceof Error ? error.message : "Unknown error",
          response:
            error instanceof Error && "response" in error
              ? (error as { response?: { data: unknown } }).response?.data
              : undefined,
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    },
    [events]
  );

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
                            <div class="fc-event-teacher">${extendedProps.teacherName}</div>
                            <div class="fc-event-student">${extendedProps.studentName}</div>
                            <div class="fc-event-time">${extendedProps.timeRange}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  `,
                };
              }}
              eventDidMount={(info) => {
                console.log("Event mounted:", info.event);
              }}
              slotDuration="00:15:00"
              slotLabelInterval="01:00"
              expandRows={true}
            />
          </div>
        </div>
      </div>
      <CalendarStyles />
    </div>
  );
}
