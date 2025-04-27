import { Patient } from "@/types/patient";

export interface DashboardStats {
  totalPatients: number;
  newPatientsThisWeek: number;
  followUps: number;
  urgentCases: number;
}

export interface Appointment {
  id: string;
  time: string;
  patientName: string;
  patientId: string;
  type: "Follow-up" | "Initial" | "Urgent";
  status: "pending" | "completed" | "cancelled";
  date: string; // ISO date string
}

export interface Activity {
  id: string;
  message: string;
  timestamp: string;
  createdAt: Date; // Actual timestamp for calculation
  type: "new_patient" | "follow_up" | "urgent" | "notification";
  patientId?: string;
  read: boolean;
}

// Format relative time (e.g., "2h ago", "just now")
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return "just now";
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  
  return `${Math.floor(diffInDays / 7)}w ago`;
};

// Get all patients from localStorage
const getPatientsFromStorage = (): Patient[] => {
  const storedPatients = localStorage.getItem("kenya-chw-patients");
  if (storedPatients) {
    return JSON.parse(storedPatients);
  }
  return [];
};

// Get appointments from localStorage or create default ones if none exist
const getAppointmentsFromStorage = (): Appointment[] => {
  const storedAppointments = localStorage.getItem("kenya-chw-appointments");
  if (storedAppointments) {
    return JSON.parse(storedAppointments);
  }
  
  // Generate default appointments based on patients
  const patients = getPatientsFromStorage();
  if (patients.length === 0) return [];
  
  const defaultAppointments: Appointment[] = patients.slice(0, 3).map((patient, index) => {
    const times = ["09:00", "10:30", "14:00"];
    const types: ("Follow-up" | "Initial" | "Urgent")[] = ["Follow-up", "Initial", "Urgent"];
    
    return {
      id: `appt-${Date.now()}-${index}`,
      time: times[index],
      patientName: patient.name,
      patientId: patient.id,
      type: types[index],
      status: "pending",
      date: new Date().toISOString().split('T')[0] // Today's date
    };
  });
  
  localStorage.setItem("kenya-chw-appointments", JSON.stringify(defaultAppointments));
  return defaultAppointments;
};

// Get activity from localStorage or create default if none exists
const getActivityFromStorage = (): Activity[] => {
  const storedActivity = localStorage.getItem("kenya-chw-activity");
  if (storedActivity) {
    const parsed = JSON.parse(storedActivity);
    // Convert stored timestamps to Date objects
    return parsed.map((activity: any) => ({
      ...activity,
      createdAt: activity.createdAt ? new Date(activity.createdAt) : new Date(),
      timestamp: activity.createdAt ? formatRelativeTime(new Date(activity.createdAt)) : activity.timestamp
    }));
  }
  
  // Generate default activity based on patients
  const patients = getPatientsFromStorage();
  if (patients.length === 0) return [];
  
  const defaultActivity: Activity[] = patients.slice(0, 3).map((patient, index) => {
    const types: ("new_patient" | "follow_up" | "urgent")[] = ["new_patient", "follow_up", "urgent"];
    const messages = [
      `New patient registered - ${patient.name}`,
      `Follow-up completed - ${patient.name}`,
      `Urgent case reported - ${patient.name}`
    ];
    
    // Create timestamps at different times
    const now = new Date();
    const timestamps = [
      new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      new Date(now.getTime() - 1 * 60 * 60 * 1000)  // 1 hour ago
    ];
    
    return {
      id: `activity-${Date.now()}-${index}`,
      message: messages[index],
      timestamp: formatRelativeTime(timestamps[index]),
      createdAt: timestamps[index],
      type: types[index],
      patientId: patient.id,
      read: false
    };
  });
  
  localStorage.setItem("kenya-chw-activity", JSON.stringify(defaultActivity));
  return defaultActivity;
};

// Calculate statistics based on actual patients data
export const getDashboardStats = (): DashboardStats => {
  const patients = getPatientsFromStorage();
  
  // Get one week ago date
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const newPatientsThisWeek = patients.filter(patient => {
    const createdDate = new Date(patient.createdAt);
    return createdDate >= oneWeekAgo;
  }).length;
  
  const followUps = patients.filter(patient => patient.followUp).length;
  
  // For demo purposes, count 10% of patients as urgent cases (minimum 1 if any patients)
  const urgentCases = patients.length > 0 ? Math.max(1, Math.floor(patients.length * 0.1)) : 0;
  
  return {
    totalPatients: patients.length,
    newPatientsThisWeek,
    followUps,
    urgentCases
  };
};

export const getTodayAppointments = (): Appointment[] => {
  const appointments = getAppointmentsFromStorage();
  const today = new Date().toISOString().split('T')[0];
  
  // Return appointments for today
  return appointments.filter(appt => appt.date === today);
};

export const getRecentActivity = (): Activity[] => {
  const activities = getActivityFromStorage();
  
  // Update the timestamps to be relative to now
  return activities.map(activity => ({
    ...activity,
    timestamp: formatRelativeTime(activity.createdAt)
  }));
};

// Save appointments to localStorage
export const saveAppointments = (appointments: Appointment[]): void => {
  localStorage.setItem("kenya-chw-appointments", JSON.stringify(appointments));
};

// Save activity to localStorage
export const saveActivity = (activity: Activity[]): void => {
  localStorage.setItem("kenya-chw-activity", JSON.stringify(activity));
};

// Add a new appointment
export const addAppointment = (appointment: Omit<Appointment, 'id'>): Appointment => {
  const appointments = getAppointmentsFromStorage();
  const newAppointment = {
    ...appointment,
    id: `appt-${Date.now()}`
  };
  
  appointments.push(newAppointment);
  saveAppointments(appointments);
  return newAppointment;
};

// Update appointment status
export const updateAppointmentStatus = (id: string, status: Appointment['status']): boolean => {
  const appointments = getAppointmentsFromStorage();
  const index = appointments.findIndex(appt => appt.id === id);
  
  if (index !== -1) {
    appointments[index].status = status;
    saveAppointments(appointments);
    return true;
  }
  
  return false;
};

// Mark activity as read
export const markActivityAsRead = (id: string): boolean => {
  const activities = getActivityFromStorage();
  const index = activities.findIndex(activity => activity.id === id);
  
  if (index !== -1) {
    activities[index].read = true;
    saveActivity(activities);
    return true;
  }
  
  return false;
};

// Add a new activity
export const addActivity = (activity: Omit<Activity, 'id' | 'createdAt'>): Activity => {
  const activities = getActivityFromStorage();
  const now = new Date();
  
  const newActivity = {
    ...activity,
    id: `activity-${Date.now()}`,
    createdAt: now,
    timestamp: formatRelativeTime(now)
  };
  
  activities.unshift(newActivity); // Add to the beginning of the array
  saveActivity(activities);
  return newActivity;
};
