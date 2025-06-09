"use client";

import { useState, useEffect } from "react";
import Calendar from "./components/calendar/Calendar";
import Login from "./components/auth/Login";
import { CalendarProvider } from "./store/CalendarContext";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <CalendarProvider>
      <div className="h-screen">
        <Calendar />
      </div>
    </CalendarProvider>
  );
}
