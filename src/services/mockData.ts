
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
  type: "Follow-up" | "Initial" | "Urgent";
  status: "pending" | "completed" | "cancelled";
}

export interface Activity {
  id: string;
  message: string;
  timestamp: string;
  type: "new_patient" | "follow_up" | "urgent" | "notification";
}

// Mock data
export const getDashboardStats = (): DashboardStats => ({
  totalPatients: 24,
  newPatientsThisWeek: 5,
  followUps: 3,
  urgentCases: 1,
});

export const getTodayAppointments = (): Appointment[] => [
  {
    id: "1",
    time: "09:00",
    patientName: "John Kamau",
    type: "Follow-up",
    status: "pending"
  },
  {
    id: "2",
    time: "10:30",
    patientName: "Mary Wanjiku",
    type: "Initial",
    status: "pending"
  },
  {
    id: "3",
    time: "14:00",
    patientName: "Peter Omondi",
    type: "Urgent",
    status: "pending"
  }
];

export const getRecentActivity = (): Activity[] => [
  {
    id: "1",
    message: "New patient registered - Mary Wanjiku",
    timestamp: "2h ago",
    type: "new_patient"
  },
  {
    id: "2",
    message: "Follow-up completed - John Kamau",
    timestamp: "4h ago",
    type: "follow_up"
  },
  {
    id: "3",
    message: "Urgent case reported - Peter Omondi",
    timestamp: "1h ago",
    type: "urgent"
  }
];
