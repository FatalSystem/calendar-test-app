"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { EventDropArg, DateSelectArg, PluginDef } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { Event } from "./types";
import TeacherSelector from "./TeacherSelector";
import CalendarStyles from "./CalendarStyles";
import { calendarApi } from "@/app/api/calendar";
import { useCalendarStore } from "@/app/store/calendarStore";

// Dynamically import FullCalendar with no SSR
const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
  loading: () => <div>Loading calendar...</div>,
});

export default function Calendar() {
  const {
    events,
    teachers,
    selectedTeachers,
    setSelectedTeachers,
    fetchEvents,
    fetchTeachers,
    updateEvent,
    getTeacherColor,
    isLoading,
    error,
  } = useCalendarStore();

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
    const loadData = async () => {
      await Promise.all([fetchEvents(), fetchTeachers()]);
    };
    loadData();
  }, [fetchEvents, fetchTeachers]);

  const processedEvents = useMemo(() => {
    return events
      .filter((event) => {
        const teacherId = event.resourceId || event.teacher_id?.toString();
        return selectedTeachers.includes(teacherId || "");
      })
      .map((event) => {
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;

        const teacher = teachers.find((t) => t.id === parseInt(event.resourceId || "0"));
        const teacherName = teacher ? `${teacher.first_name} ${teacher.last_name}` : "Unknown Teacher";

        if (event.isUnavailable || (event.name && event.name.startsWith("Not Available"))) {
          return {
            id: event.id.toString(),
            title: teacherName,
            start: startDate,
            end: endDate,
            resourceId: event.resourceId || event.teacher_id?.toString(),
            isUnavailableBlock: true,
            backgroundColor: "#e5e7eb", // Tailwind gray-200
            borderColor: "#e5e7eb",
            display: "background", // This makes it a background event
            editable: false, // Disable dragging
            interactive: false, // Disable clicking
            extendedProps: {
              teacherName,
            },
          };
        }

        const teacherColor = getTeacherColor(parseInt(event.resourceId || "0"));

        const calendarEvent = {
          id: event.id.toString(),
          title: event.name || "Event",
          start: startDate,
          end: endDate,
          resourceId: event.resourceId || event.teacher_id?.toString(),
          extendedProps: {
            teacherName,
            studentName: event.student_name_text || "No Student",
            timeRange: `${startDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })} - ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
            classType: event.class_type,
            classStatus: event.class_status,
            paymentStatus: event.payment_status,
          },
          backgroundColor: teacherColor,
          borderColor: teacherColor,
        };

        return calendarEvent;
      })
      .filter((event): event is NonNullable<typeof event> => event !== null);
  }, [events, selectedTeachers, teachers, getTeacherColor]);

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
        updateEvent(Date.now(), optimisticEvent);

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
          updateEvent(Date.now(), calendarResponse);
        } catch (error) {
          // Revert optimistic update on error
          updateEvent(Date.now(), optimisticEvent);
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
    [selectedTeachers, teachers, updateEvent]
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

      // Optimistically update the UI using Zustand
      updateEvent(parseInt(event.id), optimisticEvent);

      try {
        // Update the calendar event
        if (originalEvent.calendar_id) {
          await calendarApi.updateEvent(originalEvent.calendar_id, {
            lesson_id: originalEvent.id,
            startDate: event.start.toISOString(),
            endDate: event.end.toISOString(),
            teacher_id: parseInt(originalEvent.resourceId || "0"),
            student_id: originalEvent.student_id,
            class_type: originalEvent.class_type,
            class_status: originalEvent.class_status,
            payment_status: originalEvent.payment_status,
            duration: Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60)),
          });
        }
      } catch (error) {
        // Revert optimistic update on error
        updateEvent(parseInt(event.id), originalEvent);
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
    [events, updateEvent]
  );

  const handleEventResize = useCallback(
    async (resizeInfo: EventResizeDoneArg) => {
      const { event } = resizeInfo;
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

      // Optimistically update the UI using Zustand
      updateEvent(parseInt(event.id), optimisticEvent);

      try {
        // Update the calendar event
        if (originalEvent.calendar_id) {
          await calendarApi.updateEvent(originalEvent.calendar_id, {
            lesson_id: originalEvent.id,
            startDate: event.start.toISOString(),
            endDate: event.end.toISOString(),
            teacher_id: parseInt(originalEvent.resourceId || "0"),
            student_id: originalEvent.student_id,
            class_type: originalEvent.class_type,
            class_status: originalEvent.class_status,
            payment_status: originalEvent.payment_status,
            duration: Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60)),
          });
        }
      } catch (error) {
        // Revert optimistic update on error
        updateEvent(parseInt(event.id), originalEvent);
        resizeInfo.revert();
        console.error("Error resizing event:", {
          error: error instanceof Error ? error.message : "Unknown error",
          response:
            error instanceof Error && "response" in error
              ? (error as { response?: { data: unknown } }).response?.data
              : undefined,
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    },
    [events, updateEvent]
  );

  if (plugins.length === 0) {
    return <div>Loading calendar plugins...</div>;
  }

  if (isLoading) {
    return <div>Loading calendar data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }
  console.log(teachers);
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeacherSelector
          teachers={teachers.map((t) => ({
            id: String(t.id),
            name: `${t.first_name} ${t.last_name}`,
            color: t.color,
          }))}
          selectedTeachers={selectedTeachers}
          onTeacherSelect={setSelectedTeachers}
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
              eventResize={handleEventResize}
              eventResizableFromStart={true}
              height="100%"
              slotMinTime="00:00:00"
              slotMaxTime="24:00:00"
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
                const { isUnavailableBlock } = eventInfo.event.extendedProps;
                if (isUnavailableBlock) {
                  return {
                    html: `
                      <div style="
                        background:#e5e7eb;
                        color:#374151;
                        padding:8px;
                        border-radius:6px;
                        text-align:center;
                        pointer-events:none;
                        z-index:1;
                      ">
                        <span style="font-weight:500;">${eventInfo.event.title} - N/A</span>
                      </div>
                    `,
                  };
                }
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
