import { BackendTeacher, Student, ClassType, CalendarLink } from "@/app/api/calendar";

export type { BackendTeacher, Student, ClassType, CalendarLink };

export interface Event {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  resourceId: string;
  teacher_id?: number;
  teacherColor: string;
  eventColor: string;
  class_type: string;
  class_status: string;
  payment_status: string;
  duration: number;
  recurrenceRule?: string;
  isUnavailable: boolean;
  student_name: string;
  student_name_text: string;
  calendar_id: number;
  student_id: number;
  Student?: {
    first_name: string;
    last_name: string;
  };
}
