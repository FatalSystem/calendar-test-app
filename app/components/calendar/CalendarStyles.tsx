"use client";

export default function CalendarStyles() {
  return (
    <style jsx global>{`
      .fc {
        font-family: system-ui, -apple-system, sans-serif;
        color: #111827 !important;
        background-color: white;
        border-radius: 1rem;
        overflow: hidden;
      }

      .fc .fc-toolbar {
        margin-bottom: 1.5rem !important;
        padding: 1rem !important;
        background-color: #f8fafc !important;
        border-radius: 0.75rem !important;
      }

      .fc .fc-toolbar-title {
        font-size: 1.5rem !important;
        font-weight: 600 !important;
        color: #1e293b !important;
      }

      .fc .fc-button {
        background-color: #3b82f6 !important;
        border-color: #3b82f6 !important;
        padding: 0.28rem 0.7rem !important;
        font-size: 0.95rem !important;
        font-weight: 500 !important;
        text-transform: capitalize !important;
        border-radius: 0.5rem !important;
        transition: all 0.2s ease !important;
      }

      .fc .fc-button:hover {
        background-color: #2563eb !important;
        border-color: #2563eb !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }

      .fc .fc-button-primary:not(:disabled).fc-button-active,
      .fc .fc-button-primary:not(:disabled):active {
        background-color: #1d4ed8 !important;
        border-color: #1d4ed8 !important;
        transform: translateY(0);
      }

      .fc .fc-button-group .fc-button {
        margin-right: 0.25rem !important;
      }
      
      .fc .fc-button-group .fc-button:last-child {
        margin-right: 0 !important;
      }

      .fc .fc-timegrid-slot {
        height: 0.45rem !important;
      }

      .fc .fc-timegrid-slot-label {
        font-size: 0.5rem !important;
        color: #6b7280 !important;
        padding: 0.04rem !important;
        line-height: 0.45rem !important;
      }

      .fc .fc-timegrid-axis {
        padding: 0.07rem 0.5rem !important;
        min-width: 54px !important;
        max-width: 70px !important;
        background: #fff !important;
        z-index: 1 !important;
        position: static !important;
        left: unset !important;
        right: unset !important;
      }

      .fc .fc-timegrid-axis-cushion {
        font-size: 0.6rem !important;
        color: #6b7280 !important;
        padding: 0.07rem !important;
        line-height: 0.7rem !important;
      }

      .fc .fc-timegrid-col-frame {
        min-height: 80% !important;
      }

      .fc .fc-timegrid-col-events {
        margin: 0 !important;
        padding: 0 !important;
      }

      .fc .fc-timegrid-event {
        margin: 0 0 0.18rem 0 !important;
        padding: 0.12rem 0.18rem !important;
        border-radius: 0.18rem !important;
        border: none !important;
        color: white !important;
        font-size: 0.52rem !important;
        line-height: 0.95rem !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        word-break: break-word !important;
        white-space: normal !important;
      }

      .fc .fc-timegrid-event:hover {
        transform: scale(1.02) !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
      }

      .fc .fc-timegrid-event .fc-event-main {
        padding: 0.08rem 0.1rem !important;
        word-break: break-word !important;
        white-space: normal !important;
      }

      .fc .fc-timegrid-event .fc-event-title {
        font-weight: 500 !important;
        margin-bottom: 0.05rem !important;
        line-height: 1.05rem !important;
        word-break: break-word !important;
        white-space: normal !important;
      }

      .fc .fc-timegrid-event .fc-event-time {
        font-size: 0.48rem !important;
        opacity: 0.9 !important;
        line-height: 0.9rem !important;
      }

      .fc .fc-timegrid-now-indicator-line {
        border-color: #ef4444 !important;
        border-width: 1px !important;
      }

      .fc .fc-timegrid-now-indicator-arrow {
        border-color: #ef4444 !important;
        border-width: 3px !important;
      }

      .fc .fc-col-header-cell {
        padding: 0.75rem !important;
        background-color: #f8fafc !important;
        border-color: #e2e8f0 !important;
      }

      .fc .fc-col-header-cell-cushion {
        padding: 0.75rem !important;
        font-weight: 600 !important;
        color: #1e293b !important;
        text-decoration: none !important;
      }

      .fc .fc-timegrid-slot-lane {
        border-color: #e2e8f0 !important;
      }

      .fc .fc-timegrid-slot-minor {
        border-color: #f1f5f9 !important;
      }

      .fc .fc-timegrid-slot-label-frame {
        text-align: center !important;
      }

      .fc .fc-timegrid-slot-label-cushion {
        padding: 0.05rem !important;
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
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1rem;
        background-color: white;
        padding: 1.25rem;
        border-radius: 1rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06);
        height: calc(100vh - 250px);
        overflow-y: auto;
        border: 1px solid #e5e7eb;
      }

      .teacher-selector::-webkit-scrollbar {
        width: 6px;
      }

      .teacher-selector::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }

      .teacher-selector::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }

      .teacher-selector::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }

      .teacher-button {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1.25rem;
        border-radius: 0.75rem;
        border: 1px solid #e5e7eb;
        background-color: white;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
        text-align: left;
        font-weight: 500;
        color: #374151;
      }

      .teacher-button:hover {
        background-color: #f8fafc;
        transform: translateX(4px);
        border-color: #cbd5e1;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .teacher-button.selected {
        border-color: transparent;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06);
        background-color: #f1f5f9;
      }

      .teacher-color {
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 9999px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .fc .fc-timegrid-event.fc-event-background {
        z-index: 1 !important;
        pointer-events: none !important;
      }

      .fc .fc-timegrid-event:not(.fc-event-background) {
        z-index: 2 !important;
      }

      .fc-createEvent-button {
        background-color: #2563eb !important;
        color: #fff !important;
        border-radius: 0.5rem !important;
        font-weight: 600 !important;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
        padding: 0.35rem 0.8rem !important;
        font-size: 0.95rem !important;
        border: none !important;
        margin-left: 0.5rem !important;
        transition: background 0.2s, box-shadow 0.2s;
      }
      .fc-createEvent-button:hover,
      .fc-createEvent-button:focus {
        background-color: #1d4ed8 !important;
        color: #fff !important;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
      }
    `}</style>
  );
}
