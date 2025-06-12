"use client";

import Link from "next/link";
import { useSidebar } from "@/app/store/SidebarContext";
import "./Sidebar.css";

export default function Sidebar() {
  const { isSidebarOpen } = useSidebar();

  return (
    <div className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
      <ul className="sidebar-menu">
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/availability">Availability</Link>
        </li>
        <li>
          <Link href="/classes">Classes</Link>
        </li>
        <li>
          <Link href="/teachers">Teachers</Link>
        </li>
      </ul>
    </div>
  );
}
