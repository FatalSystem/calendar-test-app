import React, { useState, useEffect } from "react";
import "./TeacherProfile.css";

const TIMEZONES = [
  "Europe/Kyiv",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Warsaw",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Vilnius",
  "Europe/Minsk",
  "Europe/Moscow",
  "Asia/Almaty",
  "Asia/Tbilisi",
  "Asia/Baku",
  "Asia/Yerevan",
  "Asia/Tashkent",
  "Asia/Bishkek",
  "Asia/Aqtau",
  "Asia/Aqtobe",
  "Asia/Atyrau",
  "Asia/Oral",
  "Asia/Qostanay",
  "Asia/Qyzylorda",
  "Asia/Samarkand",
  "Asia/Tashkent",
  "Asia/Ust-Nera",
  "Asia/Vladivostok",
  "Asia/Yakutsk",
  "Asia/Yekaterinburg",
  "Asia/Yerevan",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "America/Denver",
  "America/Toronto",
  "America/Vancouver",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Africa/Nairobi",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Seoul",
  "Pacific/Auckland",
  "Pacific/Fiji",
];

const ROLES = [
  { value: "teacher", label: "Teacher" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

export default function TeacherProfile() {
  const [timezone, setTimezone] = useState<string>("");
  const [role, setRole] = useState<string>("teacher");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const tz =
      localStorage.getItem("teacher_timezone") ||
      Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);
    const r = localStorage.getItem("user_role") || "teacher";
    setRole(r);
  }, []);

  useEffect(() => {
    if (timezone) localStorage.setItem("teacher_timezone", timezone);
  }, [timezone]);
  useEffect(() => {
    if (role) localStorage.setItem("user_role", role);
  }, [role]);

  const filteredTimezones = TIMEZONES.filter((tz) =>
    tz.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container">
      <h2 className="heading">Profile Settings</h2>
      <div className="form-group">
        <label className="label">Role (for demo)</label>
        <select
          className="select"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="label">Timezone</label>
        <input
          className="input"
          placeholder="Search timezone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="relative">
          <select
            className="select"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            size={Math.min(6, filteredTimezones.length)}
          >
            {filteredTimezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
