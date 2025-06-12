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
    teacherId: string
  ): Promise<Class> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // First update the calendar event status
    const statusResponse = await fetch(`/api/proxy/calendar/events/${eventId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (!statusResponse.ok) throw new Error('Failed to update event status');

    // Then create or update the class record
    const classData = {
      studentId,
      teacherId,
      status,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toISOString().split('T')[1].slice(0, 5),
      type: 'Regular',
      studentName: 'Student', // Default value, should be replaced with actual student name
      teacherName: 'Teacher'  // Default value, should be replaced with actual teacher name
    };

    // If status is not "Cancelled", update student balance and teacher salary
    if (status !== 'Cancelled') {
      // These will be handled by the backend
      // The backend will update student balance and teacher salary accordingly
    }

    return await classesApi.addClass(classData);
  }
}; 