// src/services/mockData.ts
import { Patient } from "@/types/patient";
import { useAppContext } from "@/context/AppContext";
import { format } from "date-fns";

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
  id: number;
  message: string;
  createdAt: Date;
  type: "new_patient" | "follow_up" | "urgent" | "notification" | string;
  patientId?: string | number;
  read: boolean;
  lastUpdated: string;
}

// Format relative time (e.g., "2h ago", "just now")
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return `${Math.floor(diffInDays / 7)}w ago`;
};

// Calculate statistics based on current state
export const getDashboardStats = (patients: Patient[], consultations: any[]): DashboardStats => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const newPatientsThisWeek = patients.filter(patient => {
    const createdDate = new Date(patient.lastUpdated);
    return createdDate >= oneWeekAgo;
  }).length;

  const followUps = consultations.filter(c => c.status === "pending" && c.patient_id).length;

  const urgentCases = consultations.filter(c =>
    c.notes?.toLowerCase().includes("urgent") || c.notes?.toLowerCase().includes("emergency")
  ).length;

  return {
    totalPatients: patients.length,
    newPatientsThisWeek,
    followUps,
    urgentCases,
  };
};

// Convert consultation to appointment
const consultationToAppointment = (consultation: any, patients: Patient[]): Appointment => {
  const patient = patients.find(p => p.id === consultation.patient_id);
  const date = new Date(consultation.lastUpdated);
  return {
    id: consultation.id.toString(),
    time: format(date, "HH:mm"),
    patientName: patient ? patient.name : "Unknown",
    patientId: consultation.patient_id?.toString() || "",
    type: consultation.notes?.toLowerCase().includes("urgent")
      ? "Urgent"
      : consultation.notes?.toLowerCase().includes("initial")
      ? "Initial"
      : "Follow-up",
    status: consultation.status,
    date: format(date, "yyyy-MM-dd"),
  };
};

export const getTodayAppointments = (consultations: any[], patients: any[]): Appointment[] => {
  const today = new Date().toISOString().split("T")[0];
  return consultations
    .map((consult: any) => consultationToAppointment(consult, patients))
    .filter(apt => apt.date === today);
};

// Helper to create new activity
export const createActivity = (
  message: string,
  type: string,
  patientId?: string | number
): Activity => ({
  id: Date.now(), // tempId
  message,
  type,
  patientId,
  read: false,
  createdAt: new Date(),
  lastUpdated: new Date().toISOString(),
});

// Helper to create new consultation (appointment)
export const createConsultation = (
  patientId: string | number,
  notes: string,
  status: "pending" | "completed" | "cancelled" = "pending"
): any => ({
  id: Date.now(), // tempId
  patient_id: patientId,
  notes,
  status,
  lastUpdated: new Date().toISOString(),
});

/**
 * Hook to get and format activities
 */
export const useActivities = () => {
  const { state } = useAppContext();
  return (state.userData?.activities || []).map(activity => ({
    ...activity,
    timestamp: formatRelativeTime(new Date(activity.createdAt)),
  }));
};

/**
 * Hook to get dashboard stats
 */
export const useDashboardStats = () => {
  const { state } = useAppContext();
  return getDashboardStats(state.userData?.patients || [], state.userData?.consultations || []);
};

/**
 * Hook to get today's appointments
 */
export const useTodayAppointments = () => {
  const { state } = useAppContext();
  return getTodayAppointments(state.userData?.consultations || [], state.userData?.patients || []);
};

/**
 * Hook to mark activity as read
 */
export const useMarkActivityAsRead = () => {
  const { state, setState, addToSyncQueue } = useAppContext();

  return (id: string | number) => {
    if (!state.userData) return false;

    const updatedActivities = state.userData.activities.map(activity =>
      activity.id === id ? { ...activity, read: true } : activity
    );

    // 1) Update userData locally:
    setState(prev => ({
      ...prev,
      userData: {
        ...prev.userData!,
        activities: updatedActivities,
      },
    }));

    // 2) Enqueue an "update" for Activity → model name = "Activity"
    addToSyncQueue({
      type: "update",
      model: "Activity",
      data: updatedActivities.find(a => a.id === id),
      // no tempId needed since this is not a create
    });

    return true;
  };
};

/**
 * Hook to add new activity
 */
export const useAddActivity = () => {
  const { state, setState, addToSyncQueue } = useAppContext();

  return (message: string, type: Activity["type"], patientId?: string | number) => {
    if (!state.userData) return;

    // 1) Create the Activity object (with a local tempId = timestamp)
    const newActivity = createActivity(message, type, patientId);

    const updatedActivities = [newActivity, ...state.userData.activities];

    // 2) Update local state
    setState(prev => ({
      ...prev,
      userData: {
        ...prev.userData!,
        activities: updatedActivities,
      },
    }));

    // 3) Enqueue a "create" for Activity
    addToSyncQueue({
      type: "create",
      model: "Activity",
      data: newActivity,
      tempId: newActivity.id.toString(),
    });

    return newActivity;
  };
};

/**
 * Hook to add new appointment (consultation)
 */
export const useAddConsultaion = () => {
  const { state, setState, addToSyncQueue } = useAppContext();
  const addActivity = useAddActivity(); // We’ll call this after createConsultation

  return (patientId: string | number, notes: string, status: "pending" | "completed" | "cancelled" = "pending") => {
    if (!state.userData) return;

    // 1) Create the Consultation object (with a tempId = timestamp)
    const newConsultation = createConsultation(patientId, notes, status);

    const updatedConsultations = [...state.userData.consultations, newConsultation];

    // 2) Update local state
    setState(prev => ({
      ...prev,
      userData: {
        ...prev.userData!,
        consultations: updatedConsultations,
      },
    }));

    // 3) Enqueue a "create" for Consultation
    addToSyncQueue({
      type: "create",
      model: "Consultation",
      data: newConsultation,
      tempId: newConsultation.id.toString(),
    });

    // 4) Also create an activity for this new consultation
    const activityType = notes.toLowerCase().includes("urgent") ? "urgent" : "info";
    addActivity(`New consultation for patient ${patientId}`, activityType, patientId);

    return newConsultation;
  };
};

/**
 * Hook to update consultation status
 */
export const useUpdateConsultationStatus = () => {
  const { state, setState, addToSyncQueue } = useAppContext();

  return (id: string, status: "pending" | "completed" | "cancelled") => {
    if (!state.userData) return false;

    const updatedConsultations = state.userData.consultations.map(consultation =>
      consultation.id.toString() === id.toString() ? { ...consultation, status, lastUpdated: new Date().toISOString() } : consultation
    );

    // 1) Update local state
    setState(prev => ({
      ...prev,
      userData: {
        ...prev.userData!,
        consultations: updatedConsultations,
      },
    }));

    // 2) Enqueue an "update" for Consultation
    const updatedObject = updatedConsultations.find(c => c.id.toString() === id.toString());
    if (updatedObject) {
      addToSyncQueue({
        type: "update",
        model: "Consultation",
        data: updatedObject,
        // existing ID is already “real” on the server (or tempId if not yet synced),
        // so tempId is optional here. If this consultation was just created and hasn’t been synced,
        // the server can match on the previous tempId→id mapping returned in /api/sync results.
      });
    }

    return true;
  };
};

/**
 * Hook to add new patient
 */
export const useAddPatient = () => {
  const { state, setState, addToSyncQueue } = useAppContext();
  const addActivity = useAddActivity();

  return (patientData: Omit<Patient, "id" | "lastUpdated">) => {
    if (!state.userData) return;

    // 1) Create the Patient object (tempId = timestamp)
    const newPatient = {
      ...patientData,
      id: Date.now(), // tempId
      lastUpdated: new Date().toISOString(),
    };

    const updatedPatients = [...state.userData.patients, newPatient];

    // 2) Update local state
    setState(prev => ({
      ...prev,
      userData: {
        ...prev.userData!,
        patients: updatedPatients,
      },
    }));

    // 3) Enqueue a "create" for Patient
    addToSyncQueue({
      type: "create",
      model: "Patient",
      data: newPatient,
      tempId: newPatient.id.toString(),
    });

    // 4) Add activity for new patient
    addActivity(`New patient registered: ${patientData.name}`, "new_patient", newPatient.id);

    return newPatient;
  };
};

/**
 * Hook to get patient by ID
 */
export const usePatientById = () => {
  const { state } = useAppContext();
  return (id: string | number) => {
    return (state.userData?.patients || []).find(p => p.id.toString() === id.toString());
  };
};

/**
 * Hook to get consultations by patient ID
 */
export const useConsultationsByPatientId = () => {
  const { state } = useAppContext();
  return (patientId: string | number) => {
    return (state.userData?.consultations || []).filter(c => c.patient_id?.toString() === patientId.toString());
  };
};
