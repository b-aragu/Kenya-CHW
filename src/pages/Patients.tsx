
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MobileLayout from "@/components/layout/MobileLayout";
import AppNavigation from "@/components/AppNavigation";
import PatientList from "@/components/patients/PatientList";
import { Patient } from "@/types/patient";

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const auth = localStorage.getItem("kenya-chw-auth");
    if (!auth) {
      navigate("/");
      return;
    }

    // Load patients from localStorage or use mock data for MVP
    const loadPatients = () => {
      const storedPatients = localStorage.getItem("kenya-chw-patients");
      if (storedPatients) {
        setPatients(JSON.parse(storedPatients));
      } else {
        // Provide mock data if no patients exist
        const mockPatients: Patient[] = [
          {
            id: "CHW-001234",
            name: "Jane Wambui",
            dateOfBirth: "1992-04-15",
            gender: "female",
            village: "Nyali",
            phoneNumber: "+254712345678",
            createdAt: "2023-08-10T08:30:00Z",
            followUp: true,
          },
          {
            id: "CHW-002345",
            name: "John Kamau",
            dateOfBirth: "1985-12-03",
            gender: "male",
            village: "Likoni",
            phoneNumber: "+254723456789",
            createdAt: "2023-09-05T14:45:00Z",
            followUp: false,
          },
          {
            id: "CHW-003456",
            name: "Mary Njeri",
            dateOfBirth: "2018-07-22",
            gender: "female",
            village: "Bamburi",
            createdAt: "2023-10-12T09:15:00Z",
            followUp: true,
          },
        ];
        setPatients(mockPatients);
        localStorage.setItem("kenya-chw-patients", JSON.stringify(mockPatients));
      }
      setIsLoading(false);
    };

    // Simulate network delay
    setTimeout(loadPatients, 800);
  }, [navigate]);

  const handlePatientSelect = (id: string) => {
    navigate(`/patients/${id}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light pb-16">
      <MobileLayout title="Patients">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse-light">Loading patients...</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button 
                onClick={() => navigate('/patients/add')}
                className="bg-primary hover:bg-primary/80"
              >
                <svg className="mr-2" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" x2="12" y1="5" y2="19"></line>
                  <line x1="5" x2="19" y1="12" y2="12"></line>
                </svg>
                Add Patient
              </Button>
            </div>
            
            <PatientList 
              patients={patients} 
              onPatientSelect={handlePatientSelect} 
            />
          </div>
        )}
      </MobileLayout>
      <AppNavigation />
    </div>
  );
};

export default Patients;
