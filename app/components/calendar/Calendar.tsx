"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  EventDropArg,
  DateSelectArg,
  PluginDef,
  EventInput,
  EventClickArg,
} from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import TeacherSelector from "./TeacherSelector";
import CalendarStyles from "./CalendarStyles";
import { calendarApi } from "@/app/api/calendar";
import EventCreateForm from "./EventCreateForm";
import "./Calendar.css";
import { useCalendarContext } from "@/app/store/CalendarContext";
import LessonStatusModal from "./LessonStatusModal";
import { DateTime } from "luxon";
import Link from "next/link";
import { useSidebar } from "@/app/store/SidebarContext";
import { classesApi } from "@/app/api/classes";

// Dynamically import FullCalendar with no SSR
const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
  loading: () => <div>Loading calendar...</div>,
});

// Helper to get a comprehensive list of timezones
const COMMON_TIMEZONES = [
  "local",
  "UTC",
  "Europe/Kyiv",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Asia/Bangkok",
  "Asia/Dubai",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Africa/Johannesburg",
  "Pacific/Auckland",
  // Add more as needed
];

function CustomTimezoneDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = value === "local" ? "Local Time" : value;

  return (
    <div style={{ position: "relative", minWidth: 180 }}>
      <button
        type="button"
        className="input"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          cursor: "pointer",
          borderRadius: 8,
          padding: "8px 12px", // Better padding
          border: "1px solid #d1d5db", // Light border
          backgroundColor: "white", // White background
          color: "#374151", // Dark text
          fontSize: "14px",
          fontWeight: "500",
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{selectedLabel}</span>
        <svg
          style={{ marginLeft: 8, width: 16, height: 16 }}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            zIndex: 20,
            top: "110%",
            left: 0,
            width: "100%",
            background: "white", // Changed from dark to white
            border: "1px solid #e5e7eb", // Light border
            borderRadius: 8,
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", // Better shadow
            maxHeight: 260,
            overflowY: "auto",
          }}
        >
          {COMMON_TIMEZONES.map((tz) => (
            <button
              key={tz}
              type="button"
              className="dropdown-item"
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 16px",
                background: tz === value ? "#dbeafe" : "transparent", // Blue selection like calendar
                color: tz === value ? "#1d4ed8" : "#374151", // Blue text when selected
                fontWeight: tz === value ? 600 : 400,
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 14,
              }}
              onClick={() => {
                onChange(tz);
                setOpen(false);
              }}
            >
              {tz === "local" ? "Local Time" : tz}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper to get user role and teacher id (mocked via localStorage for now)
function getUserRole() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("user-role") || "teacher"; // 'teacher' or 'manager'
  }
  return "teacher";
}
function getCurrentTeacherId() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("current-teacher-id") || "";
  }
  return "";
}

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
  } = useCalendarContext();

  const [plugins, setPlugins] = useState<PluginDef[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalStart, setCreateModalStart] = useState<Date | null>(null);
  const [createModalEnd, setCreateModalEnd] = useState<Date | null>(null);
  const [timezone, setTimezone] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("calendar-tz") || "local"
      : "local"
  );

  const role = getUserRole();
  const { openSidebar } = useSidebar();
  const currentTeacherId = getCurrentTeacherId();
  // For manager: selected teacher state
  const [selectedTeacherId, setSelectedTeacherId] = useState(() => {
    if (role === "manager" && teachers.length > 0) {
      return String(teachers[0].id);
    }
    if (role === "teacher") {
      return currentTeacherId;
    }
    return "";
  });

  useEffect(() => {
    if (localStorage.getItem("token")) {
      openSidebar();
    }
  });

  // Update selected teacher if teachers list changes (for manager)
  useEffect(() => {
    if (role === "manager" && teachers.length > 0 && !selectedTeacherId) {
      setSelectedTeacherId(String(teachers[0].id));
    }
  }, [role, teachers, selectedTeacherId, currentTeacherId]);

  useEffect(() => {
    if (
      role === "manager" &&
      teachers.length > 0 &&
      selectedTeachers.length === 0
    ) {
      console.log("Initializing selectedTeachers for manager:", {
        teachers,
        role,
        currentTeacherId,
      });
      setSelectedTeachers(teachers.map((t) => String(t.id)));
    }
    // Do not auto-select if already set, so manual selection works
  }, [
    role,
    teachers,
    selectedTeachers.length,
    setSelectedTeachers,
    currentTeacherId,
  ]);

  useEffect(() => {
    if (role === "teacher" && currentTeacherId) {
      console.log("Setting selectedTeachers for teacher:", {
        currentTeacherId,
        role,
      });
      setSelectedTeachers([currentTeacherId]);
    }
  }, [role, currentTeacherId, setSelectedTeachers]);

  useEffect(() => {
    const loadPlugins = async () => {
      const [
        { default: dayGridPlugin },
        { default: timeGridPlugin },
        { default: interactionPlugin },
      ] = await Promise.all([
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("calendar-tz", timezone);
    }
  }, [timezone]);

  const processedEvents = useMemo(() => {
    console.log("Processing events:", {
      totalEvents: events.length,
      selectedTeachers,
      role,
      currentTeacherId,
    });

    const filteredEvents = events.filter((event) => {
      // Якщо вибрано тільки одного вчителя, показуємо тільки його події
      if (selectedTeachers.length === 1) {
        const isSelected = selectedTeachers[0] === event.resourceId;
        console.log("Single teacher filtering:", {
          eventId: event.id,
          resourceId: event.resourceId,
          selectedTeacher: selectedTeachers[0],
          isSelected,
        });
        return isSelected;
      }

      // Якщо вибрано кілька вчителів, показуємо події всіх вибраних
      const isSelected = selectedTeachers.includes(event.resourceId);
      console.log("Multiple teachers filtering:", {
        eventId: event.id,
        resourceId: event.resourceId,
        isSelected,
        selectedTeachers,
      });
      return isSelected;
    });

    console.log("Filtered events:", {
      totalFiltered: filteredEvents.length,
      filteredEvents,
    });

    return filteredEvents
      .map((event) => {
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        const teacher = teachers.find(
          (t) => t.id === parseInt(event.resourceId)
        );
        const teacherColor = getTeacherColor(parseInt(event.resourceId));
        const teacherName = teacher
          ? `${teacher.first_name} ${teacher.last_name}`
          : "";
        // Add RSVR if reserved, Trial if class_type is trial
        let studentName = event.student_name_text || "No Student";
        if (event.class_type === "trial") {
          studentName = `Trial ${studentName}`;
        }
        if (event.payment_status === "reserved") {
          studentName = `RSVR ${studentName}`;
        }
        // If this is an unavailable block, render as red with N/A
        if (event.isUnavailable) {
          return {
            id: `unavailable-${event.id}`,
            title: "Not Available",
            start: startDate,
            end: endDate,
            resourceId: event.resourceId || event.teacher_id?.toString(),
            extendedProps: {
              isUnavailableBlock: true,
              teacherName,
            },
            backgroundColor: "#dc2626", // red-600
            borderColor: "#dc2626",
          };
        }
        // Otherwise, render as a normal lesson/event
        const calendarEvent = {
          id: event.id.toString(),
          title: event.name || "Event",
          start: startDate,
          end: endDate,
          resourceId: event.resourceId || event.teacher_id?.toString(),
          extendedProps: {
            teacherName,
            studentName,
            timeRange: `${startDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })} - ${endDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}`,
            classType: event.class_type,
            classStatus: event.class_status,
            // paymentStatus: event.payment_status, // REMOVE from display
          },
          backgroundColor: teacherColor,
          borderColor: teacherColor,
        };
        return calendarEvent;
      })
      .filter((event): event is NonNullable<typeof event> => event !== null);
  }, [
    events,
    selectedTeachers,
    teachers,
    getTeacherColor,
    currentTeacherId,
    role,
  ]);

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
            if (
              eventRanges[i].start < eventRanges[j].end &&
              eventRanges[i].end > eventRanges[j].start
            ) {
              currentOverlap++;
            }
          }
          maxOverlap = Math.max(maxOverlap, currentOverlap);
        }

        // Default width
        const defaultWidth = 120;
        // Only expand if more than 2 overlapping events
        const expandedWidth =
          maxOverlap > 1 ? defaultWidth + (maxOverlap - 2) * 60 : defaultWidth;

        columnElement.style.minWidth = `${expandedWidth}px`;
        columnElement.style.width = `${expandedWidth}px`;
        columnElement.style.maxWidth = `400px`;

        // Also set the header cell width
        const date = columnElement.getAttribute("data-date");
        if (date) {
          const headerCell = document.querySelector(
            `th[data-date=\"${date}\"]`
          ) as HTMLElement;
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

  const handleSelect = useCallback((selectInfo: DateSelectArg) => {
    setCreateModalStart(selectInfo.start);
    setCreateModalEnd(selectInfo.end);
    setCreateModalOpen(true);
  }, []);

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
          await calendarApi.updateEvent(originalEvent.id.toString(), {
            lesson_id: originalEvent.id,
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
          await calendarApi.updateEvent(originalEvent.id.toString(), {
            lesson_id: originalEvent.id,
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

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const eventInput: EventInput = {
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.start
        ? new Date(clickInfo.event.start)
        : undefined,
      end: clickInfo.event.end ? new Date(clickInfo.event.end) : undefined,
      extendedProps: clickInfo.event.extendedProps,
      backgroundColor: clickInfo.event.backgroundColor,
      borderColor: clickInfo.event.borderColor,
      resourceId: clickInfo.event.extendedProps?.resourceId,
    };
    setSelectedEvent(eventInput);
    setModalOpen(true);
  }, []);

  // 1. Log events fetched from backend
  useEffect(() => {
    if (events) {
      console.log("Fetched events from backend:", {
        totalEvents: events.length,
        events: events,
        firstEvent: events[0],
        lastEvent: events[events.length - 1],
      });
    }
  }, [events]);

  // 2. Log selected teacherId
  useEffect(() => {
    console.log("Selected teacherId:", {
      selectedTeacherId,
      role,
      currentTeacherId,
    });
  }, [selectedTeacherId, role, currentTeacherId]);

  // 3. Log filtered events shown in calendar
  useEffect(() => {
    if (processedEvents) {
      console.log("Events shown in calendar:", {
        totalProcessedEvents: processedEvents.length,
        processedEvents: processedEvents,
        selectedTeachers: selectedTeachers,
        teachers: teachers,
      });
    }
  }, [processedEvents, selectedTeachers, teachers]);

  useEffect(() => {
    console.log("Calendar state:", {
      selectedTeachers,
      teachers,
      events,
      processedEvents,
    });
  }, [selectedTeachers, teachers, events, processedEvents]);

  // Add periodic check for reserved classes
  useEffect(() => {
    const checkReservedClasses = async () => {
      try {
        await calendarApi.checkAndDeleteReservedClasses();
        // Refresh events after checking
        fetchEvents();
      } catch (error) {
        console.error("Error checking reserved classes:", error);
      }
    };

    // Check immediately when component mounts
    checkReservedClasses();

    // Then check every 5 minutes
    const interval = setInterval(checkReservedClasses, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchEvents, currentTeacherId]);

  const handleStatusUpdate = async (eventId: number, status: string) => {
    try {
      const event = events.find((e) => e.id === eventId);
      if (!event) return;

      await classesApi.handleCalendarStatusUpdate(
        eventId.toString(),
        status,
        event.student_id.toString(),
        event.resourceId
      );

      fetchEvents();
    } catch (error) {
      console.error("Error updating class status:", error);
    }
  };

  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusEditValue, setStatusEditValue] = useState<string>("");
  const [statusEditLoading, setStatusEditLoading] = useState(false);
  const [statusEditError, setStatusEditError] = useState<string | null>(null);
  const [statusEditDropdownOpen, setStatusEditDropdownOpen] = useState(false);

  const [currentTime, setCurrentTime] = useState(() =>
    DateTime.now().setZone(timezone)
  );
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(DateTime.now().setZone(timezone));
    }, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

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
    <div className="calendar-container">
      <div
        className="calendar-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 24px 10px 24px",
          borderRadius: 0,
          marginBottom: 18,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <h2
            style={{
              margin: 0,
              color: "#000",
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: -1,
            }}
          >
            Calendar
          </h2>
          <span style={{ color: "#9ca3af", fontSize: 15, fontWeight: 400 }}>
            Manage your schedule and lessons
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <label
            style={{
              color: "#fff",
              marginRight: 8,
              fontWeight: 500,
              fontSize: 15,
            }}
          >
            Timezone:
          </label>
          <CustomTimezoneDropdown value={timezone} onChange={setTimezone} />
          <span
            style={{
              marginLeft: 12,
              fontWeight: 600,
              fontSize: 16,
              color: "#2563eb",
              letterSpacing: 1,
              minWidth: 120,
              display: "inline-block",
            }}
          >
            {currentTime.toFormat("dd.MM.yyyy, HH:mm:ss")}
          </span>
          <Link href="/availability">
            <button
              className="button"
              style={{
                background: "#2563eb",
                color: "white",
                fontWeight: 600,
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 16,
                marginLeft: 16,
                boxShadow: "0 2px 8px rgba(37,99,235,0.08)",
                border: "none",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              Set Availability
            </button>
          </Link>
        </div>
      </div>
      <div className="calendar-wrapper">
        <div className="calendar-flex">
          <div className="teacher-selector-container">
            <TeacherSelector
              teachers={teachers.map((t) => ({
                id: String(t.id),
                name: `${t.first_name} ${t.last_name}`,
                color: t.color,
              }))}
              selectedTeachers={selectedTeachers}
              onTeacherSelect={setSelectedTeachers}
              singleSelect={role === "teacher"}
            />
          </div>
          <div className="calendar-content">
            <div className="calendar-scrollable">
              <FullCalendar
                plugins={plugins}
                initialView="timeGridWeek"
                customButtons={{
                  createEvent: {
                    text: "Create New Event",
                    click: () => setCreateModalOpen(true),
                  },
                }}
                headerToolbar={{
                  left: "prev,next createEvent",
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
                timeZone={timezone}
                eventTimeFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  meridiem: false,
                  hour12: false,
                }}
                slotLabelFormat={{
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
                  // Compute student name with Trial/RSVR prefix
                  let prefix = "";
                  if (extendedProps.classType === "trial") prefix += "Trial ";
                  if (extendedProps.studentName?.startsWith("RSVR "))
                    prefix += "RSVR ";
                  let name = extendedProps.studentName || "No Student";
                  if (name.startsWith("RSVR "))
                    name = name.replace(/^RSVR /, "");
                  if (name.startsWith("Trial "))
                    name = name.replace(/^Trial /, "");
                  const studentDisplay = `${prefix}${name}`.trim();
                  return {
                    html: `
                  <div class="fc-event-main-content">
                    <div class="fc-event-title-container">
                      <div class="fc-event-title fc-sticky">
                        <div class="fc-event-details">
                          <div class="fc-event-teacher">${extendedProps.teacherName}</div>
                          <div class="fc-event-student">${studentDisplay}</div>
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
                eventClick={handleEventClick}
              />
            </div>
          </div>
        </div>
      </div>
      <CalendarStyles />
      {modalOpen && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-content event-details-modal">
            <button
              className="modal-close-x"
              onClick={() => {
                setModalOpen(false);
                setIsEditingStatus(false);
                setStatusEditError(null);
              }}
              style={{
                position: "absolute",
                top: 12,
                right: 16,
                fontSize: "2rem",
                background: "none",
                border: "none",
                color: "#222",
                cursor: "pointer",
                padding: 8,
                zIndex: 10,
                transition: "color 0.2s",
              }}
            >
              ×
            </button>
            <h2 className="modal-title">Event Details</h2>
            {!isEditingStatus ? (
              <>
                <div className="modal-fields-grid">
                  <div className="modal-field">
                    <span className="modal-label">Start:</span>
                    <span className="modal-value">
                      {selectedEvent.start &&
                        selectedEvent.start.toLocaleString("uk-UA", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                    </span>
                  </div>
                  <div className="modal-field">
                    <span className="modal-label">End:</span>
                    <span className="modal-value">
                      {selectedEvent.end &&
                        selectedEvent.end.toLocaleString("uk-UA", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                    </span>
                  </div>
                  <div className="modal-field">
                    <span className="modal-label">Teacher:</span>
                    <span className="modal-value">
                      {selectedEvent.extendedProps?.teacherName}
                    </span>
                  </div>
                  <div className="modal-field">
                    <span className="modal-label">Student:</span>
                    <span className="modal-value">
                      {(() => {
                        let prefix = "";
                        if (selectedEvent.extendedProps?.classType === "trial")
                          prefix += "Trial ";
                        if (
                          selectedEvent.extendedProps?.studentName?.startsWith(
                            "RSVR "
                          )
                        )
                          prefix += "RSVR ";
                        let name =
                          selectedEvent.extendedProps?.studentName ||
                          "No Student";
                        if (name.startsWith("RSVR "))
                          name = name.replace(/^RSVR /, "");
                        if (name.startsWith("Trial "))
                          name = name.replace(/^Trial /, "");
                        return `${prefix}${name}`.trim();
                      })()}
                    </span>
                  </div>
                  <div className="modal-field">
                    <span className="modal-label">Status:</span>
                    <span className="modal-value">
                      {selectedEvent.extendedProps?.classStatus || "scheduled"}
                    </span>
                  </div>
                </div>
                <div className="modal-actions">
                  <button
                    className="modal-status-button"
                    onClick={() => {
                      setIsEditingStatus(true);
                      setStatusEditValue(
                        selectedEvent.extendedProps?.classStatus || "scheduled"
                      );
                    }}
                  >
                    Change Status
                  </button>
                  <button
                    className="modal-close-button"
                    onClick={() => setModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-fields-grid">
                  <div className="modal-field">
                    <span className="modal-label">Status:</span>
                    <div
                      className="dropdown"
                      style={{ minWidth: 180, position: "relative" }}
                    >
                      <button
                        type="button"
                        className="dropdown-button"
                        onClick={() => {
                          setStatusEditLoading(false);
                          setStatusEditError(null);
                          setStatusEditDropdownOpen((v) => !v);
                        }}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 6,
                          border: "1px solid #d1d5db",
                          fontSize: 16,
                          width: "100%",
                          textAlign: "left",
                          background: "white",
                          color: "#374151",
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                        disabled={statusEditLoading}
                      >
                        <span>
                          {(() => {
                            switch (statusEditValue) {
                              case "Given":
                                return "Completed";
                              case "No show student":
                                return "Student No Show";
                              case "No show teacher":
                                return "Teacher No Show";
                              case "Cancelled":
                                return "Cancelled";
                              case "scheduled":
                                return "Scheduled";
                              default:
                                return statusEditValue;
                            }
                          })()}
                        </span>
                        <svg
                          style={{ marginLeft: 8, width: 16, height: 16 }}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {statusEditDropdownOpen && (
                        <div
                          className="dropdown-menu"
                          style={{
                            position: "absolute",
                            zIndex: 20,
                            top: "110%",
                            left: 0,
                            width: "100%",
                            background: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                          }}
                        >
                          <button
                            type="button"
                            className="dropdown-item"
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "10px 16px",
                              background:
                                statusEditValue === "Given"
                                  ? "#dbeafe"
                                  : "transparent",
                              color:
                                statusEditValue === "Given"
                                  ? "#1d4ed8"
                                  : "#374151",
                              fontWeight:
                                statusEditValue === "Given" ? 600 : 400,
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: 14,
                            }}
                            onClick={() => {
                              setStatusEditValue("Given");
                              setStatusEditDropdownOpen(false);
                            }}
                          >
                            Completed
                          </button>
                          <button
                            type="button"
                            className="dropdown-item"
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "10px 16px",
                              background:
                                statusEditValue === "No show student"
                                  ? "#dbeafe"
                                  : "transparent",
                              color:
                                statusEditValue === "No show student"
                                  ? "#1d4ed8"
                                  : "#374151",
                              fontWeight:
                                statusEditValue === "No show student"
                                  ? 600
                                  : 400,
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: 14,
                            }}
                            onClick={() => {
                              setStatusEditValue("No show student");
                              setStatusEditDropdownOpen(false);
                            }}
                          >
                            Student No Show
                          </button>
                          {role === "manager" && (
                            <button
                              type="button"
                              className="dropdown-item"
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "10px 16px",
                                background:
                                  statusEditValue === "No show teacher"
                                    ? "#dbeafe"
                                    : "transparent",
                                color:
                                  statusEditValue === "No show teacher"
                                    ? "#1d4ed8"
                                    : "#374151",
                                fontWeight:
                                  statusEditValue === "No show teacher"
                                    ? 600
                                    : 400,
                                border: "none",
                                borderRadius: 4,
                                cursor: "pointer",
                                fontSize: 14,
                              }}
                              onClick={() => {
                                setStatusEditValue("No show teacher");
                                setStatusEditDropdownOpen(false);
                              }}
                            >
                              Teacher No Show
                            </button>
                          )}
                          <button
                            type="button"
                            className="dropdown-item"
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "10px 16px",
                              background:
                                statusEditValue === "Cancelled"
                                  ? "#dbeafe"
                                  : "transparent",
                              color:
                                statusEditValue === "Cancelled"
                                  ? "#1d4ed8"
                                  : "#374151",
                              fontWeight:
                                statusEditValue === "Cancelled" ? 600 : 400,
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: 14,
                            }}
                            onClick={() => {
                              setStatusEditValue("Cancelled");
                              setStatusEditDropdownOpen(false);
                            }}
                          >
                            Cancelled
                          </button>
                          <button
                            type="button"
                            className="dropdown-item"
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "10px 16px",
                              background:
                                statusEditValue === "scheduled"
                                  ? "#dbeafe"
                                  : "transparent",
                              color:
                                statusEditValue === "scheduled"
                                  ? "#1d4ed8"
                                  : "#374151",
                              fontWeight:
                                statusEditValue === "scheduled" ? 600 : 400,
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: 14,
                            }}
                            onClick={() => {
                              setStatusEditValue("scheduled");
                              setStatusEditDropdownOpen(false);
                            }}
                          >
                            Scheduled
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {statusEditError && (
                    <div
                      className="error-message"
                      style={{ color: "#dc3545", marginTop: 8 }}
                    >
                      {statusEditError}
                    </div>
                  )}
                </div>
                <div className="modal-actions">
                  <button
                    className="modal-status-button"
                    disabled={statusEditLoading}
                    onClick={async () => {
                      setStatusEditLoading(true);
                      setStatusEditError(null);
                      try {
                        await handleStatusUpdate(
                          Number(selectedEvent.id),
                          statusEditValue
                        );
                        setIsEditingStatus(false);
                        setModalOpen(false);
                        setStatusEditLoading(false);
                        fetchEvents();
                      } catch {
                        setStatusEditError(
                          "Failed to update status. Please try again."
                        );
                        setStatusEditLoading(false);
                      }
                    }}
                  >
                    {statusEditLoading ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="modal-close-button"
                    disabled={statusEditLoading}
                    onClick={() => {
                      setIsEditingStatus(false);
                      setStatusEditError(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {statusModalOpen && (
        <LessonStatusModal
          isOpen={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          lessonId={0}
          currentStatus={"scheduled"}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
      {createModalOpen && (
        <div className="modal-overlay">
          <div className="modal-create-content">
            <h2 className="modal-create-title">Create New Event</h2>
            <EventCreateForm
              teachers={teachers}
              onClose={() => setCreateModalOpen(false)}
              timezone={timezone}
              start={createModalStart}
              end={createModalEnd}
            />
          </div>
        </div>
      )}
    </div>
  );
}
