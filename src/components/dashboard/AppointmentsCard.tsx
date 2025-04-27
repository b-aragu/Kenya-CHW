
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AppointmentsCard = () => {
  // Mock data - in real app, this would come from a data source
  const todayAppointments = [
    { time: "10:00", patient: "Jane Doe", type: "Follow-up" },
    { time: "11:30", patient: "John Smith", type: "Initial" },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
        <Calendar className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        {todayAppointments.length > 0 ? (
          <div className="space-y-2">
            {todayAppointments.map((apt, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium">{apt.time}</span>
                <span className="text-gray-600">{apt.patient}</span>
                <span className="text-xs bg-accent px-2 py-1 rounded-full">
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
