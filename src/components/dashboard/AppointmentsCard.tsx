// src/components/AppointmentsCard.tsx
import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Calendar, Check, X, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Appointment,
  getTodayAppointments,
  useUpdateConsultationStatus,
  useAddActivity,
  useAddConsultaion,
} from "@/services/mockData";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";

// Define the ref interface
export interface AppointmentsCardRef {
  refresh: () => void;
}

const AppointmentsCard = forwardRef<AppointmentsCardRef, {}>((_, ref) => {
  const { state } = useAppContext();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // 1) Get the update‐status function from the hook (which now also enqueues a SyncChange)
  const updateConsultationStatus = useUpdateConsultationStatus();

  // 2) Grab the hooks that enqueue “createActivity” and “createConsultation”
  const addActivity = useAddActivity();
  const addConsultaion = useAddConsultaion();

  // 3) Fetch “today’s” appointments by reading localStorage
  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const consultations = state.userData?.consultations || [];
      const patients = state.userData?.patients || [];
      const data = getTodayAppointments(consultations, patients);
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Expose the refresh method via ref
  useImperativeHandle(ref, () => ({
    refresh: fetchAppointments,
  }));

  useEffect(() => {
    fetchAppointments();
  }, [state.userData]);

  // 4) handleStatusChange now calls the hook‐returned function,
  //    then createActivity (via addActivity), then re‐fetch.
  const handleStatusChange = (
    id: string,
    status: "completed" | "cancelled",
    patientName: string,
    patientId: string
  ) => {
    // 4.a) Update appointment status → this enqueues a SyncChange("update","Consultation",...)
    updateConsultationStatus(id, status);

    // 4.b) Add activity via hook (this also enqueues a SyncChange("create","Activity",...))
    addActivity(
      `Appointment ${status}: ${patientName}`,
      status === "completed" ? "follow_up" : "notification",
      patientId
    );

    // 4.c) Refresh appointments
    fetchAppointments();
  };

  // 5) Schedule a quick follow-up → createConsultation (enqueue SyncChange), then createActivity (enqueue SyncChange), then re‐fetch
  const handleAddQuickFollowUp = (patientId: string, patientName: string) => {
    // (Note: createConsultation inside useAddConsultaion will automatically enqueue a
    //         SyncChange({ type: "create", model: "Consultation", ... }))
    addConsultaion(patientId, "Follow-up visit", "pending");

    // And then createActivity
    addActivity(`Follow-up scheduled: ${patientName}`, "notification", patientId);

    // Refresh appointments
    fetchAppointments();
  };

  const handlePatientClick = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
        <Calendar className="h-4 w-4 text-primary" />
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        ) : appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div key={apt.id} className="flex flex-col space-y-1 p-2 rounded-md bg-neutral-50">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{apt.time}</span>
                  <span
                    className="text-gray-600 cursor-pointer hover:underline"
                    onClick={() => handlePatientClick(apt.patientId)}
                  >
                    {apt.patientName}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      apt.type === "Urgent"
                        ? "bg-destructive/10 text-destructive"
                        : apt.type === "Follow-up"
                        ? "bg-primary/10 text-primary"
                        : "bg-accent text-accent-foreground"
                    }`}
                  >
                    {apt.type}
                  </span>
                </div>

                {apt.status === "pending" && (
                  <div className="flex items-center justify-end space-x-2 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 flex items-center bg-green-50 hover:bg-green-100 border-green-200"
                      onClick={() =>
                        handleStatusChange(
                          apt.id,
                          "completed",
                          apt.patientName,
                          apt.patientId
                        )
                      }
                    >
                      <Check className="h-3.5 w-3.5 mr-1 text-green-600" />
                      <span className="text-xs text-green-600">Complete</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 flex items-center bg-red-50 hover:bg-red-100 border-red-200"
                      onClick={() =>
                        handleStatusChange(
                          apt.id,
                          "cancelled",
                          apt.patientName,
                          apt.patientId
                        )
                      }
                    >
                      <X className="h-3.5 w-3.5 mr-1 text-red-600" />
                      <span className="text-xs text-red-600">Cancel</span>
                    </Button>
                  </div>
                )}

                {apt.status === "completed" && (
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 flex items-center"
                      onClick={() =>
                        handleAddQuickFollowUp(apt.patientId, apt.patientName)
                      }
                    >
                      <Plus className="h-3.5 w-3.5 mr-1 text-primary" />
                      <span className="text-xs">Schedule Follow-up</span>
                    </Button>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      Completed
                    </span>
                  </div>
                )}

                {apt.status === "cancelled" && (
                  <div className="flex justify-between items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 flex items-center"
                      onClick={() =>
                        handleAddQuickFollowUp(apt.patientId, apt.patientName)
                      }
                    >
                      <Plus className="h-3.5 w-3.5 mr-1 text-primary" />
                      <span className="text-xs">Reschedule</span>
                    </Button>
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                      Cancelled
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-2">No appointments scheduled for today</p>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 mt-2"
              onClick={() => navigate("/consult")}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Schedule New Appointment</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

AppointmentsCard.displayName = "AppointmentsCard";

export default AppointmentsCard;
