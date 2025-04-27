import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Calendar, Check, X, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTodayAppointments, updateAppointmentStatus, addActivity, addAppointment, Appointment } from "@/services/mockData";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

// Define the ref interface
export interface AppointmentsCardRef {
  refresh: () => void;
}

const AppointmentsCard = forwardRef<AppointmentsCardRef, {}>((_, ref) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const data = getTodayAppointments();
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Expose the refresh method via ref
  useImperativeHandle(ref, () => ({
    refresh: fetchAppointments
  }));

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusChange = (id: string, status: "completed" | "cancelled", patientName: string, patientId: string) => {
    // Update appointment status
    updateAppointmentStatus(id, status);
    
    // Add activity
    addActivity({
      message: `Appointment ${status}: ${patientName}`,
      timestamp: "just now",
      type: status === "completed" ? "follow_up" : "notification",
      patientId,
      read: false
    });
    
    // Refresh appointments
    fetchAppointments();
  };

  const handlePatientClick = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  // Add a quick follow-up appointment for a patient
  const handleAddQuickFollowUp = (patientId: string, patientName: string) => {
    // Create a new appointment 7 days from now
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    const newAppointment = {
      patientId,
      patientName,
      time: "10:00", // Default time
      type: "Follow-up" as const,
      status: "pending" as const,
      date: format(oneWeekFromNow, 'yyyy-MM-dd')
    };
    
    addAppointment(newAppointment);
    
    // Add activity
    addActivity({
      message: `Follow-up scheduled: ${patientName}`,
      timestamp: "just now",
      type: "notification",
      patientId,
      read: false
    });
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
              <div key={i} className="h-6 bg-gray-100 animate-pulse rounded"></div>
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
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    apt.type === 'Urgent' ? 'bg-destructive/10 text-destructive' :
                    apt.type === 'Follow-up' ? 'bg-primary/10 text-primary' :
                    'bg-accent text-accent-foreground'
                  }`}>
                    {apt.type}
                  </span>
                </div>
                
                {apt.status === 'pending' && (
                  <div className="flex items-center justify-end space-x-2 mt-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 px-2 flex items-center bg-green-50 hover:bg-green-100 border-green-200"
                      onClick={() => handleStatusChange(apt.id, "completed", apt.patientName, apt.patientId)}
                    >
                      <Check className="h-3.5 w-3.5 mr-1 text-green-600" />
                      <span className="text-xs text-green-600">Complete</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 px-2 flex items-center bg-red-50 hover:bg-red-100 border-red-200"
                      onClick={() => handleStatusChange(apt.id, "cancelled", apt.patientName, apt.patientId)}
                    >
                      <X className="h-3.5 w-3.5 mr-1 text-red-600" />
                      <span className="text-xs text-red-600">Cancel</span>
                    </Button>
                  </div>
                )}
                
                {apt.status === 'completed' && (
                  <div className="flex items-center justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 flex items-center"
                      onClick={() => handleAddQuickFollowUp(apt.patientId, apt.patientName)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1 text-primary" />
                      <span className="text-xs">Schedule Follow-up</span>
                    </Button>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      Completed
                    </span>
                  </div>
                )}
                
                {apt.status === 'cancelled' && (
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 flex items-center"
                      onClick={() => handleAddQuickFollowUp(apt.patientId, apt.patientName)}
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
              onClick={() => navigate('/consult')}
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
