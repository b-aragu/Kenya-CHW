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
import { ConsultationRequest } from "@/services/groqService";
import { getConsultations } from "@/services/groqService";

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [triageResults, setTriageResults] = useState<TriageResult[]>([]);
  const [showTriageForm, setShowTriageForm] = useState(false);
  const [consultations, setConsultations] = useState<any[]>([]);

  useEffect(() => {
    // Load patient data from localStorage
    const loadPatient = () => {
      const storedPatients = localStorage.getItem("kenya-chw-patients");
      if (storedPatients) {
        const patients: Patient[] = JSON.parse(storedPatients);
        const foundPatient = patients.find(p => p.id === id);
        
        if (foundPatient) {
          setPatient(foundPatient);
          
          // Load triage results for this patient
          const storedTriageResults = localStorage.getItem("kenya-chw-triage-results");
          if (storedTriageResults) {
            const allResults: TriageResult[] = JSON.parse(storedTriageResults);
            const patientResults = allResults.filter(r => r.patientId === id);
            setTriageResults(patientResults);
          }
          
          // Load consultations for this patient
          const allConsultations = getConsultations();
          const patientConsultations = allConsultations.filter(c => c.patientId === id);
          setConsultations(patientConsultations);
        } else {
          toast({
            title: "Patient not found",
            description: "The requested patient could not be found",
            variant: "destructive",
          });
          navigate("/patients");
        }
      } else {
        navigate("/patients");
      }
      setIsLoading(false);
    };

    // Simulate network delay
    setTimeout(loadPatient, 500);
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
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title={patient?.name || 'Patient Details'} 
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
                  <p className="font-medium">{patient?.id}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Age
                  </p>
                  <p className="font-medium">{calculateAge(patient?.dateOfBirth || '')} years</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs">Gender</p>
                  <p className="font-medium capitalize">{patient?.gender}</p>
                </div>

                {patient?.village && (
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Village
                    </p>
                    <p className="font-medium">{patient.village}</p>
                  </div>
                )}

                {patient?.phoneNumber && (
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
                if (patient) {
                  // Calculate age from date of birth
                  const birthDate = new Date(patient.dateOfBirth);
                  const today = new Date();
                  let age = today.getFullYear() - birthDate.getFullYear();
                  const monthDiff = today.getMonth() - birthDate.getMonth();
                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                  }
                
                  // Navigate to consult page with patient information
                  localStorage.setItem('create-consultation', JSON.stringify({
                    patientId: patient.id,
                    patientName: patient.name,
                    patientInfo: {
                      age,
                      gender: patient.gender,
                      village: patient.village,
                      medicalHistory: patient.medicalHistory,
                      chronicConditions: patient.chronicConditions,
                      allergies: patient.allergies,
                      medications: patient.medications,
                      pregnancyStatus: patient.gender === 'female' ? patient.pregnancyStatus : undefined,
                    }
                  }));
                  
                  // Navigate to consult page
                  navigate('/consult');
                }
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
                navigate(`/patients/${patient?.id}/history`);
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
                              if (patient) {
                                // Calculate age from date of birth
                                const birthDate = new Date(patient.dateOfBirth);
                                const today = new Date();
                                let age = today.getFullYear() - birthDate.getFullYear();
                                const monthDiff = today.getMonth() - birthDate.getMonth();
                                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                  age--;
                                }
                              
                                // Create consultation from this assessment
                                localStorage.setItem('create-consultation', JSON.stringify({
                                  patientId: patient.id,
                                  patientName: patient.name,
                                  patientInfo: {
                                    age,
                                    gender: patient.gender,
                                    village: patient.village,
                                    medicalHistory: patient.medicalHistory,
                                    chronicConditions: patient.chronicConditions,
                                    allergies: patient.allergies,
                                    medications: patient.medications,
                                    pregnancyStatus: patient.gender === 'female' ? patient.pregnancyStatus : undefined,
                                  },
                                  symptoms: result.symptoms,
                                  vitalSigns: {
                                    temperature: result.temperature,
                                    respiratoryRate: result.respiratoryRate
                                  }
                                }));
                                
                                // Navigate to consult page
                                navigate('/consult');
                              }
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
