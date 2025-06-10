import { BackendTeacher, Student, ClassType, CalendarLink } from "@/app/api/calendar";

export type { BackendTeacher, Student, ClassType, CalendarLink };

export type LessonStatus = 'scheduled' | 'completed' | 'cancelled' | 'student_no_show' | 'teacher_no_show';
export type PaymentStatus = 'paid' | 'reserved';

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
  class_status: LessonStatus;
  payment_status: PaymentStatus;
  duration: number;
  recurrenceRule?: string;
  isUnavailable: boolean;
  student_name: string;
  student_name_text: string;
  calendar_id: number;
  student_id: number;
  student_balance?: number;
  Student?: {
    first_name: string;
    last_name: string;
  };
}
