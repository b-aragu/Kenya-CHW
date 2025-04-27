
import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTodayAppointments, Appointment } from "@/services/mockData";

const AppointmentsCard = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be an API call
        const data = getTodayAppointments();
        setAppointments(data);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);

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
          <div className="space-y-2">
            {appointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{apt.time}</span>
                <span className="text-gray-600">{apt.patientName}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  apt.type === 'Urgent' ? 'bg-destructive/10 text-destructive' :
                  apt.type === 'Follow-up' ? 'bg-primary/10 text-primary' :
                  'bg-accent text-accent-foreground'
                }`}>
                  {apt.type}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No appointments scheduled</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentsCard;
