
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import AppNavigation from "@/components/AppNavigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

const Consult = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [consultations, setConsultations] = useState<any[]>([]);

  useEffect(() => {
    // Check if user is authenticated
    const auth = localStorage.getItem("kenya-chw-auth");
    if (!auth) {
      navigate("/");
      return;
    }

    // Load mock consultations for MVP
    setTimeout(() => {
      const mockConsultations = [
        {
          id: "CON-001",
          patientName: "Jane Wambui",
          patientId: "CHW-001234",
          status: "active",
          priority: "high",
          createdAt: "2023-11-15T10:30:00Z",
          lastMessage: "Patient has severe breathing difficulty and high fever",
        },
        {
          id: "CON-002",
          patientName: "James Odhiambo",
          patientId: "CHW-004567",
          status: "pending",
          priority: "medium",
          createdAt: "2023-11-14T14:15:00Z",
          lastMessage: "Patient with persistent cough for 2 weeks",
        },
        {
          id: "CON-003",
          patientName: "Sarah Mutua",
          patientId: "CHW-005678",
          status: "completed",
          priority: "low",
          createdAt: "2023-11-12T09:45:00Z",
          lastMessage: "Follow-up on previous malaria treatment",
        },
      ];
      
      setConsultations(mockConsultations);
      setIsLoading(false);
    }, 800);
  }, [navigate]);

  const handleConsultationSelect = (consultationId: string) => {
    // In a real app, this would navigate to the consultation details
    toast({
      title: "Coming soon!",
      description: "Consultation feature will be available in the next release.",
    });
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light pb-16">
      <MobileLayout title="Consultations">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse-light">Loading consultations...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map(consultation => (
              <Card 
                key={consultation.id} 
                className="mb-4 hover:shadow-md transition-shadow"
                onClick={() => handleConsultationSelect(consultation.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{consultation.patientName}</h3>
                    <Badge
                      className={
                        consultation.priority === "high" 
                          ? "bg-destructive" 
                          : consultation.priority === "medium" 
                          ? "bg-yellow-500" 
                          : "bg-green-500"
                      }
                    >
                      {consultation.priority === "high" 
                        ? "High Priority" 
                        : consultation.priority === "medium" 
                        ? "Medium Priority" 
                        : "Low Priority"
                      }
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-2">
                    {consultation.patientId} • {formatDate(consultation.createdAt)}
                  </p>
                  
                  <p className="text-sm line-clamp-2">{consultation.lastMessage}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                  <Badge
                    variant="outline"
                    className={
                      consultation.status === "active" 
                        ? "border-green-500 text-green-500" 
                        : consultation.status === "pending" 
                        ? "border-yellow-500 text-yellow-500" 
                        : "border-gray-500 text-gray-500"
                    }
                  >
                    {consultation.status === "active" 
                      ? "Active" 
                      : consultation.status === "pending" 
                      ? "Pending" 
                      : "Completed"
                    }
                  </Badge>
                  
                  <button className="text-primary text-sm font-medium">
                    View Details →
                  </button>
                </CardFooter>
              </Card>
            ))}
            
            <div className="flex justify-center pt-4">
              <p className="text-sm text-gray-500">
                This is a preview of the consultations feature
              </p>
            </div>
          </div>
        )}
      </MobileLayout>
      <AppNavigation />
    </div>
  );
};

export default Consult;
