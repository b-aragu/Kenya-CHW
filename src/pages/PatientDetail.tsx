import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Phone, HeartPulse, MessageSquare, ClipboardList, Stethoscope, ArrowRight } from "lucide-react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MobileLayout from "@/components/layout/MobileLayout";
import TriageForm from "@/components/triage/TriageForm";
import { Patient, TriageResult } from "@/types/patient";
import { useToast } from "@/components/ui/use-toast";
import { useAppContext } from "@/context/AppContext";

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [triageResults, setTriageResults] = useState<TriageResult[]>([]);
  const [showTriageForm, setShowTriageForm] = useState(false);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const { syncOfflineChanges } = useAppContext();

  useEffect(() => {
    // Load patient data from localStorage
    const loadPatientData = () => {
      try {
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        
        // Find patient by ID
        const foundPatient = userData.patients?.find((p: any) => p.id === id);
        
        if (foundPatient) {
          // Format patient data
          const formattedPatient: Patient = {
            id: foundPatient.id,
            name: foundPatient.name,
            dateOfBirth: foundPatient.dateOfBirth || foundPatient.dob || "Unknown",
            gender: foundPatient.gender,
            village: foundPatient.location || foundPatient.village || "Unknown",
            phoneNumber: foundPatient.phone || "Unknown",
            createdAt: foundPatient.createdAt || foundPatient.registeredAt || new Date().toISOString(),
            followUp: foundPatient.followUp || false,
            chwId: foundPatient.chwId || "",
            _syncStatus: foundPatient._syncStatus || 'synced'
          };
          setPatient(formattedPatient);
          
          // Load consultations for this patient
          const patientConsultations = userData.consultations?.filter(
            (c: any) => c.patientId === id
          ) || [];
          setConsultations(patientConsultations);
          
          // Load triage results for this patient
          const storedTriageResults = localStorage.getItem("kenya-chw-triage-results");
          if (storedTriageResults) {
            const allResults: TriageResult[] = JSON.parse(storedTriageResults);
            const patientResults = allResults.filter(r => r.patientId === id);
            setTriageResults(patientResults);
          }
        } else {
          toast({
            title: "Patient not found",
            description: "The requested patient could not be found",
            variant: "destructive",
          });
          navigate("/patients");
        }
      } catch (error) {
        console.error("Error loading patient:", error);
        toast({
          title: "Error",
          description: "Failed to load patient data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Handle online/offline status
    const handleOnline = () => {
      setOfflineMode(false);
      syncOfflineChanges().then(result => {
        if (result.success) {
          loadPatientData();
          toast({
            title: "Sync Complete",
            description: "Patient data has been updated",
          });
        }
      });
    };

    const handleOffline = () => setOfflineMode(true);

    // Set up online/offline listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load patient data
    loadPatientData();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [id, navigate, toast]);

  const handleTriageComplete = (result: TriageResult) => {
    // Save triage result to localStorage
    const existingResults = localStorage.getItem("kenya-chw-triage-results");
    let allResults = existingResults ? JSON.parse(existingResults) : [];
    
    // Add new result
    allResults = [result, ...allResults];
    
    // Save back to localStorage
    localStorage.setItem("kenya-chw-triage-results", JSON.stringify(allResults));
    
    // Update local state
    setTriageResults([result, ...triageResults]);
    
    // Close triage form
    setShowTriageForm(false);
  };

  // Calculate age from date of birth
  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Check if a consultation exists for the given assessment symptoms
  const hasConsultationForAssessment = (symptoms: string) => {
    // Check if there's already a consultation with these symptoms
    return consultations.some(c => c.symptoms.includes(symptoms) || symptoms.includes(c.symptoms));
  };

  // Add a new function to get the consultation for a given assessment:
  const getConsultationForAssessment = (symptoms: string) => {
    return consultations.find(c => c.symptoms.includes(symptoms) || symptoms.includes(c.symptoms));
  };

  const handleSyncData = async () => {
    try {
      setIsLoading(true);
      const result = await syncOfflineChanges();
      if (result.success) {
        // Reload patient data
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const foundPatient = userData.patients?.find((p: any) => p.id === id);
        
        if (foundPatient) {
          setPatient({
            id: foundPatient.id,
            name: foundPatient.name,
            dateOfBirth: foundPatient.dateOfBirth || foundPatient.dob || "Unknown",
            gender: foundPatient.gender,
            village: foundPatient.location || foundPatient.village || "Unknown",
            phoneNumber: foundPatient.phone || "Unknown",
            createdAt: foundPatient.createdAt || foundPatient.registeredAt || new Date().toISOString(),
            followUp: foundPatient.followUp || false,
            chwId: foundPatient.chwId || "",
            _syncStatus: foundPatient._syncStatus || 'synced'
          });
        }
        
        toast({
          title: "Sync Successful",
          description: "Patient data has been updated",
        });
      } else {
        toast({
          title: "Sync Failed",
          description: result.error || "Could not sync data",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Sync Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MobileLayout 
        title="Patient Details" 
        showBack={true} 
        onBack={() => navigate("/patients")}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse-light">Loading patient data...</div>
        </div>
      </MobileLayout>
    );
  }

  if (!patient) {
    return (
      <MobileLayout 
        title="Not Found" 
        showBack={true} 
        onBack={() => navigate("/patients")}
      >
        <div className="text-center py-8">
          <p>Patient not found</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate("/patients")}
          >
            Back to Patients
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title={patient.name || 'Patient Details'} 
      showBack={true} 
      onBack={() => navigate("/patients")}
    >
      {showTriageForm ? (
        <TriageForm 
          patient={patient}
          onComplete={handleTriageComplete}
          onCancel={() => setShowTriageForm(false)}
        />
      ) : (
        <div className="space-y-6">
          {/* Offline Alert */}
          {offlineMode && (
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md text-sm">
              Offline Mode - Showing locally stored data. Some information may be outdated.
            </div>
          )}
          
          <Card className="overflow-hidden bg-gradient-to-br from-white to-neutral-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-primary flex items-center gap-2">
                <HeartPulse className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2 bg-neutral-light/50 p-3 rounded-lg">
                  <p className="text-gray-500 text-xs">Patient ID</p>
                  <p className="font-medium">{patient.id}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Age
                  </p>
                  <p className="font-medium">{calculateAge(patient.dateOfBirth)} years</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs">Gender</p>
                  <p className="font-medium capitalize">{patient.gender}</p>
                </div>

                {patient.village && (
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Village
                    </p>
                    <p className="font-medium">{patient.village}</p>
                  </div>
                )}

                {patient.phoneNumber && (
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone
                    </p>
                    <p className="font-medium">{patient.phoneNumber}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sync Button */}
          <Button 
            variant="outline" 
            onClick={handleSyncData}
            disabled={offlineMode}
            className={`w-full ${offlineMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <svg className="mr-2" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
            Sync Patient Data
          </Button>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => setShowTriageForm(true)}
              className="col-span-1 bg-primary hover:bg-primary/90 h-12 gap-2"
            >
              <ClipboardList className="h-5 w-5" />
              New Assessment
            </Button>
            
            <Button 
              variant="secondary"
              className="col-span-1 h-12 gap-2"
              onClick={() => {
                // Navigate to consult page with patient information
                localStorage.setItem('create-consultation', JSON.stringify({
                  patientId: patient.id,
                  patientName: patient.name,
                }));
                
                // Navigate to consult page
                navigate('/consult');
              }}
            >
              <Stethoscope className="h-5 w-5" />
              New Consultation
            </Button>
            
            <Button 
              variant="outline" 
              className="col-span-2 h-12 gap-2 border-primary/20 hover:bg-primary/5"
              onClick={() => {
                // Navigate to patient history page
                navigate(`/patients/${patient.id}/history`);
              }}
            >
              <Calendar className="h-5 w-5" />
              View History
            </Button>
          </div>

          {triageResults.length > 0 && (
            <Card className="bg-gradient-to-br from-white to-neutral-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Recent Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {triageResults.map((result, index) => (
                    <div 
                      key={index} 
                      className={`
                        border rounded-lg p-4 space-y-3 
                        ${result.priority === "red" 
                          ? "bg-red-50 border-red-100" 
                          : result.priority === "yellow" 
                          ? "bg-yellow-50 border-yellow-100" 
                          : "bg-green-50 border-green-100"
                        }
                      `}
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-gray-500">{formatDate(result.timestamp)}</p>
                        <Badge 
                          className={
                            result.priority === "red" 
                              ? "bg-destructive" 
                              : result.priority === "yellow" 
                              ? "bg-yellow-500" 
                              : "bg-green-500"
                          }
                        >
                          {result.priority === "red" 
                            ? "High Priority" 
                            : result.priority === "yellow" 
                            ? "Medium Priority" 
                            : "Low Priority"
                          }
                        </Badge>
                      </div>
                      <Separator className="my-2" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          <span className="text-gray-500">Symptoms:</span> {result.symptoms}
                        </p>
                        {result.temperature && (
                          <p className="text-sm">
                            <span className="text-gray-500">Temperature:</span> {result.temperature}°C
                          </p>
                        )}
                        {result.respiratoryRate && (
                          <p className="text-sm">
                            <span className="text-gray-500">Respiratory Rate:</span> {result.respiratoryRate} breaths/min
                          </p>
                        )}
                        
                        {hasConsultationForAssessment(result.symptoms) ? (
                          <Button 
                            variant="link" 
                            size="sm"
                            className="text-primary p-0 h-auto font-medium mt-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              const consultation = getConsultationForAssessment(result.symptoms);
                              if (consultation) {
                                // Store the consultation ID for the Consult page to pick up
                                localStorage.setItem('open-consultation-id', consultation.id);
                                navigate('/consult');
                              }
                            }}
                          >
                            <span className="flex items-center">
                              Open Consultation <ArrowRight className="h-3 w-3 ml-1" />
                            </span>
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Create consultation from this assessment
                              localStorage.setItem('create-consultation', JSON.stringify({
                                patientId: patient.id,
                                patientName: patient.name,
                                symptoms: result.symptoms,
                                vitalSigns: {
                                  temperature: result.temperature,
                                  respiratoryRate: result.respiratoryRate
                                }
                              }));
                              
                              // Navigate to consult page
                              navigate('/consult');
                            }}
                          >
                            Create Consultation
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </MobileLayout>
  );
};

export default PatientDetail;