"use client";

import React, { useState } from "react";
import "./AvailabilityPage.css";

interface Availability {
  day: string;
  ranges: { start: string; end: string }[];
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>(DAYS[0]);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");

  const handleAddRange = () => {
    if (!startTime || !endTime)
      return alert("Please specify both start and end time.");
    const updatedAvailability = [...availability];
    const dayAvailability = updatedAvailability.find(
      (a) => a.day === selectedDay
    );

    if (dayAvailability) {
      dayAvailability.ranges.push({ start: startTime, end: endTime });
    } else {
      updatedAvailability.push({
        day: selectedDay,
        ranges: [{ start: startTime, end: endTime }],
      });
    }

    setAvailability(updatedAvailability);
    setStartTime("");
    setEndTime("");
  };

  const handleRemoveRange = (day: string, index: number) => {
    const updatedAvailability = availability.map((a) =>
      a.day === day
        ? { ...a, ranges: a.ranges.filter((_, i) => i !== index) }
        : a
    );
    setAvailability(updatedAvailability);
  };

  return (
    <div className="container availability">
      <h1 className="heading">Set Your Availability</h1>
      <div className="form-group">
        <label>Day</label>
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
        >
          {DAYS.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Start Time</label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>End Time</label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
      </div>
      <button onClick={handleAddRange}>Add Range</button>

      <h2>Your Availability</h2>
      {availability.map((a) => (
        <div key={a.day}>
          <h3>{a.day}</h3>
          <ul>
            {a.ranges.map((range, index) => (
              <li key={index}>
                {range.start} - {range.end}{" "}
                <button onClick={() => handleRemoveRange(a.day, index)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
