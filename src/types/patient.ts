
export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  village?: string;
  phoneNumber?: string;
  createdAt: string;
  followUp: boolean;
}

export interface TriageResult {
  patientId: string;
  symptoms: string;
  temperature?: string;
  respiratoryRate?: string;
  priority: "green" | "yellow" | "red";
  timestamp: string;
}
