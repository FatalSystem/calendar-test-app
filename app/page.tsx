"use client";

import { useState, useEffect } from "react";
import Calendar from "./components/calendar/Calendar";
import Login from "./components/auth/Login";
import { CalendarProvider } from "./store/CalendarContext";
import { useSidebar } from "./store/SidebarContext";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { openSidebar } = useSidebar();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <Login
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          openSidebar();
        }}
      />
    );
  }

  return (
    <CalendarProvider>
      <div className="h-screen">
        <Calendar />
      </div>
    </CalendarProvider>
  );
}
