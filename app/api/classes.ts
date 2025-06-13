export interface Class {
  id: string;
  studentName: string;
  teacherName: string;
  date: string;
  time: string;
  status: string;
  type: string;
  studentId: string;
  teacherId: string;
}

export const classesApi = {
  getAllClasses: async (): Promise<Class[]> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch('/api/proxy/calendar/events', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch classes');
    const data = await response.json();
    return data.events?.rows || [];
  },

  addClass: async (classData: Omit<Class, "id">): Promise<Class> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch('/api/proxy/calendar/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(classData),
    });
    if (!response.ok) throw new Error('Failed to add class');
    return response.json();
  },

  updateClass: async (id: string, classData: Partial<Class>): Promise<Class> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`/api/proxy/calendar/events/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(classData),
    });
    if (!response.ok) throw new Error('Failed to update class');
    return response.json();
  },

  deleteClass: async (id: string): Promise<void> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`/api/proxy/calendar/events/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete class');
  },

  updateClassStatus: async (id: string, status: string): Promise<Class> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`/api/proxy/calendar/events/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update class status');
    return response.json();
  },

  handleCalendarStatusUpdate: async (
    eventId: string,
    status: string,
    studentId: string,
    teacherId: string,
    studentName: string,
    teacherName: string
  ): Promise<Omit<Class, "id">> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // First update the calendar event status
    const statusResponse = await fetch(`/api/proxy/calendar/events/${eventId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ 
        event_id: parseInt(eventId),
        class_status: status,
        student_id: studentId ? parseInt(studentId) : null,
        teacher_id: teacherId ? parseInt(teacherId) : null
      }),
    });
    
    if (!statusResponse.ok) {
      const errorData = await statusResponse.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update event status');
    }

    // Return the class data without id
    return {
      studentId,
      teacherId,
      status,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toISOString().split('T')[1].slice(0, 5),
      type: 'Regular',
      studentName,
      teacherName
    };
  }
}; 