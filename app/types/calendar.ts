export interface TimeRange {
  start: string;
  end: string;
}

export interface AvailabilityRange {
  id: number;
  start_time: string;
  end_time: string;
  day_of_week: number;
} 