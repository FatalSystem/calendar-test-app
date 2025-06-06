"use client";

export default function CalendarStyles() {
  return (
    <style jsx global>{`
      .fc {
        font-family: system-ui, -apple-system, sans-serif;
        color: #111827 !important;
      }

      .fc .fc-toolbar {
        margin-bottom: 1.5rem !important;
      }

      .fc .fc-toolbar-title {
        font-size: 1.5rem !important;
        font-weight: 600 !important;
      }

      .fc .fc-button {
        background-color: #3b82f6 !important;
        border-color: #3b82f6 !important;
        padding: 0.5rem 1rem !important;
        font-weight: 500 !important;
        text-transform: capitalize !important;
      }

      .fc .fc-button:hover {
        background-color: #2563eb !important;
        border-color: #2563eb !important;
      }

      .fc .fc-button-primary:not(:disabled).fc-button-active,
      .fc .fc-button-primary:not(:disabled):active {
        background-color: #1d4ed8 !important;
        border-color: #1d4ed8 !important;
      }

      .fc .fc-timegrid-slot {
        height: 3rem !important;
      }

      .fc .fc-timegrid-slot-label {
        font-size: 0.875rem !important;
        color: #6b7280 !important;
      }

      .fc .fc-timegrid-axis {
        padding: 0.5rem !important;
        background: #fff !important;
        z-index: 1 !important;
        position: static !important;
        left: unset !important;
        right: unset !important;
      }

      .fc .fc-timegrid-axis-cushion {
        font-size: 0.875rem !important;
        color: #6b7280 !important;
      }

      .fc .fc-timegrid-col-frame {
        min-height: 100% !important;
      }

      .fc .fc-timegrid-col-events {
        margin: 0 !important;
        padding: 0 !important;
      }

      .fc .fc-timegrid-event {
        margin: 0 !important;
        padding: 0.25rem !important;
        border-radius: 0.375rem !important;
        border: none !important;
        color: white !important;
        font-size: 0.875rem !important;
        line-height: 1.25rem !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
      }

      .fc .fc-timegrid-event:hover {
        transform: scale(1.02) !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
      }

      .fc .fc-timegrid-event .fc-event-main {
        padding: 0.25rem !important;
      }

      .fc .fc-timegrid-event .fc-event-title {
        font-weight: 500 !important;
        margin-bottom: 0.25rem !important;
      }

      .fc .fc-timegrid-event .fc-event-time {
        font-size: 0.75rem !important;
        opacity: 0.9 !important;
      }

      .fc .fc-timegrid-now-indicator-line {
        border-color: #ef4444 !important;
      }

      .fc .fc-timegrid-now-indicator-arrow {
        border-color: #ef4444 !important;
      }

      .fc .fc-col-header-cell {
        padding: 0.5rem !important;
        background-color: #f9fafb !important;
        border-color: #e5e7eb !important;
      }

      .fc .fc-col-header-cell-cushion {
        padding: 0.5rem !important;
        font-weight: 500 !important;
        color: #374151 !important;
        text-decoration: none !important;
      }

      .fc .fc-timegrid-slot-lane {
        border-color: #e5e7eb !important;
      }

      .fc .fc-timegrid-slot-minor {
        border-color: #f3f4f6 !important;
      }

      .fc .fc-timegrid-slot-label-frame {
        text-align: center !important;
      }

      .fc .fc-timegrid-slot-label-cushion {
        padding: 0.25rem !important;
      }

      /* Smaller default min-width for columns */
      .fc-timegrid-col {
        transition: width 0.3s ease !important;
      }

      .fc-timegrid-event {
        transition: width 0.3s ease !important;
      }

      /* Ensure proper text wrapping in events */
      .fc-event-title {
        word-wrap: break-word !important;
        white-space: normal !important;
      }

      /* Adjust event content for better fit */
      .fc-event-main {
        padding: 2px !important;
      }

      /* Ensure proper alignment of header content */
      .fc-col-header-cell-cushion {
        width: 100% !important;
        text-align: center !important;
      }

      /* Basic horizontal scrolling */
      .fc-scroller {
        overflow-x: auto !important;
      }

      .fc-scrollgrid {
        table-layout: auto !important;
      }

      /* Remove sticky left/right hours column and sticky header/nav */
      .fc .fc-col-header {
        position: static !important;
        top: unset !important;
        z-index: 1 !important;
        background: #f9fafb !important;
      }

      .fc .fc-toolbar {
        position: static !important;
        top: unset !important;
        z-index: 1 !important;
        background: #fff !important;
      }

      .fc-timegrid .fc-timegrid-axis:last-child {
        position: static !important;
        right: unset !important;
        left: unset !important;
        z-index: 1 !important;
        background: #fff !important;
      }

      /* Teacher selector styles */
      .teacher-selector {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }

      .teacher-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        border: 1px solid #e5e7eb;
        background-color: white;
        cursor: pointer;
        transition: all 0.2s;
      }

      .teacher-button:hover {
        background-color: #f9fafb;
      }

      .teacher-button.selected {
        border-color: transparent;
      }

      .teacher-color {
        width: 1rem;
        height: 1rem;
        border-radius: 9999px;
        border: 2px solid white;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
    `}</style>
  );
}
