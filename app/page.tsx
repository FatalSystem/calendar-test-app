"use client";

import { useState, useEffect } from "react";
import Calendar from "./components/calendar/Calendar";
import Login from "./components/auth/Login";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if we have a token on mount
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="h-screen">
      <Calendar />
    </div>
  );
}
