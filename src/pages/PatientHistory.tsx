import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Calendar, ClipboardList, Stethoscope, FileText, ArrowRight, Clock } from "lucide-react";
import { Patient, TriageResult } from "@/types/patient";
import { useToast } from "@/components/ui/use-toast";
import { useAppContext } from "@/context/AppContext";

interface Consultation {
  id: string;
  patientId: string;
  patientName: string;
  symptoms: string;
  status: "active" | "pending" | "completed";
  priority: "high" | "medium" | "low";
  createdAt: string;
  lastMessage: string;
  response?: any;
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  type: string;
  notes: string;
  status: "scheduled" | "completed" | "cancelled";
}

const PatientHistory = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [triageResults, setTriageResults] = useState<TriageResult[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const { syncOfflineChanges } = useAppContext();
  
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    
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
  
  const loadPatientData = () => {
    setIsLoading(true);
    
    try {
      // Load all data from localStorage
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
          village: foundPatient.location || "Unknown",
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
        // Note: Triage results are stored in localStorage separately
        const storedTriageResults = localStorage.getItem("kenya-chw-triage-results");
        if (storedTriageResults) {
          const allResults: TriageResult[] = JSON.parse(storedTriageResults);
          const patientResults = allResults.filter(r => r.patientId === id);
          setTriageResults(patientResults);
        }
        
        // Load appointments for this patient
        // Note: Appointments are stored in userData
        const patientAppointments = userData.appointments?.filter(
          (a: any) => a.patientId === id
        ) || [];
        setAppointments(patientAppointments);
      } else {
        toast({
          title: "Patient not found",
          description: "The requested patient could not be found",
          variant: "destructive",
        });
        navigate("/patients");
      }
    } catch (error) {
      console.error("Error loading patient history:", error);
      toast({
        title: "Error",
        description: "Failed to load patient history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
  
  const getMostRecentVitals = () => {
    if (triageResults.length > 0) {
      // Sort by date (most recent first)
      const sortedResults = [...triageResults].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      return sortedResults[0];
    }
    return null;
  };
  
  const getStatusCount = (status: "active" | "pending" | "completed") => {
    return consultations.filter(c => c.status === status).length;
  };
  
  const getPriorityCount = (priority: "high" | "medium" | "low") => {
    return consultations.filter(c => c.priority === priority).length;
  };
  
  const hasConsultationForAssessment = (symptoms: string) => {
    // Check if there's already a consultation with these symptoms
    return consultations.some(c => c.symptoms.includes(symptoms) || symptoms.includes(c.symptoms));
  };
  
  const getConsultationForAssessment = (symptoms: string) => {
    return consultations.find(c => c.symptoms.includes(symptoms) || symptoms.includes(c.symptoms));
  };

  const handleSyncData = async () => {
    try {
      setIsLoading(true);
      const result = await syncOfflineChanges();
      if (result.success) {
        loadPatientData();
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
  
  return (
    <MobileLayout 
      title="Patient History"
      showBack={true}
      onBack={() => navigate(`/patients/${id}`)}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse-light">Loading patient history...</div>
        </div>
      ) : patient ? (
        <div className="space-y-6">
          {/* Offline Alert */}
          {offlineMode && (
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md text-sm">
              Offline Mode - Showing locally stored data. Some information may be outdated.
            </div>
          )}
          
          {/* Patient Summary Card */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{patient.name}</CardTitle>
                  <CardDescription>
                    {patient.id} • {calculateAge(patient.dateOfBirth)} years • {patient.gender}
                  </CardDescription>
                </div>
                <Badge variant={patient.followUp ? "destructive" : "outline"}>
                  {patient.followUp ? "Follow-up Required" : "No Follow-up"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Recent Stats */}
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="bg-primary/5 p-2 rounded-md">
                  <p className="text-xs text-gray-500">Consultations</p>
                  <p className="text-lg font-medium">{consultations.length}</p>
                </div>
                <div className="bg-primary/5 p-2 rounded-md">
                  <p className="text-xs text-gray-500">Assessments</p>
                  <p className="text-lg font-medium">{triageResults.length}</p>
                </div>
                <div className="bg-primary/5 p-2 rounded-md">
                  <p className="text-xs text-gray-500">Appointments</p>
                  <p className="text-lg font-medium">{appointments.length}</p>
                </div>
              </div>
              
              {/* Recent Vitals */}
              {getMostRecentVitals() && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Recent Vitals</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {getMostRecentVitals()?.temperature && (
                      <div className="bg-gray-50 p-2 rounded-md">
                        <p className="text-xs text-gray-500">Temperature</p>
                        <p className="font-medium">{getMostRecentVitals()?.temperature}°C</p>
                      </div>
                    )}
                    {getMostRecentVitals()?.respiratoryRate && (
                      <div className="bg-gray-50 p-2 rounded-md">
                        <p className="text-xs text-gray-500">Respiratory Rate</p>
                        <p className="font-medium">{getMostRecentVitals()?.respiratoryRate} breaths/min</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Recorded on {formatDate(getMostRecentVitals()?.timestamp || '')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="default"
              className="gap-2 bg-primary"
              onClick={() => navigate(`/patients/${id}`)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Patient
            </Button>
            
            <Button 
              variant="outline"
              className="gap-2 border-primary/40 text-primary"
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
              <Stethoscope className="h-4 w-4" />
              New Consult
            </Button>
          </div>
          
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
          
          {/* Tabs Section */}
          <Tabs defaultValue="consultations" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="consultations" className="text-xs sm:text-sm">
                <Stethoscope className="h-4 w-4 mr-1" />
                Consultations
              </TabsTrigger>
              <TabsTrigger value="assessments" className="text-xs sm:text-sm">
                <ClipboardList className="h-4 w-4 mr-1" />
                Assessments
              </TabsTrigger>
              <TabsTrigger value="appointments" className="text-xs sm:text-sm">
                <Calendar className="h-4 w-4 mr-1" />
                Appointments
              </TabsTrigger>
            </TabsList>
            
            {/* Consultations Tab */}
            <TabsContent value="consultations" className="mt-0">
              {consultations.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-md">
                  <FileText className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-4 text-gray-500">No consultations found</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => {
                      localStorage.setItem('create-consultation', JSON.stringify({
                        patientId: patient.id,
                        patientName: patient.name,
                      }));
                      navigate('/consult');
                    }}
                  >
                    Create Consultation
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Status Stats */}
                  <div className="flex justify-between bg-gray-50 p-2 rounded-md text-xs mb-4">
                    <div className="text-center">
                      <p className="text-gray-500">Active</p>
                      <p className="font-medium">{getStatusCount("active")}</p>
                    </div>
                    <Separator orientation="vertical" />
                    <div className="text-center">
                      <p className="text-gray-500">Pending</p>
                      <p className="font-medium">{getStatusCount("pending")}</p>
                    </div>
                    <Separator orientation="vertical" />
                    <div className="text-center">
                      <p className="text-gray-500">Completed</p>
                      <p className="font-medium">{getStatusCount("completed")}</p>
                    </div>
                    <Separator orientation="vertical" />
                    <div className="text-center text-red-600">
                      <p className="text-gray-500">High Priority</p>
                      <p className="font-medium">{getPriorityCount("high")}</p>
                    </div>
                  </div>
                  
                  <ScrollArea className="h-[400px] pr-4 -mr-4">
                    {consultations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(consultation => (
                      <Card key={consultation.id} className="mb-3 hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                        // Store the consultation ID in localStorage for the Consult page to pick up
                        localStorage.setItem('open-consultation-id', consultation.id);
                        navigate('/consult');
                      }}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{consultation.id}</p>
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
                                  {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500">{formatDate(consultation.createdAt)}</p>
                            </div>
                            <Badge
                              className={
                                consultation.priority === "high" 
                                  ? "bg-destructive" 
                                  : consultation.priority === "medium" 
                                  ? "bg-yellow-500" 
                                  : "bg-green-500"
                              }
                            >
                              {consultation.priority.charAt(0).toUpperCase() + consultation.priority.slice(1)} Priority
                            </Badge>
                          </div>
                          
                          <p className="text-sm line-clamp-2 text-gray-700">{consultation.symptoms}</p>
                          
                          {consultation.response && (
                            <div className="mt-2 border-t pt-2">
                              <p className="text-xs font-medium text-gray-500">Assessment Summary:</p>
                              <p className="text-sm line-clamp-2">{consultation.response.assessment?.split('.')[0]}.</p>
                            </div>
                          )}
                          
                          <div className="flex justify-end items-center text-primary text-xs font-medium mt-2">
                            View Details <ArrowRight className="h-3 w-3 ml-1" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </TabsContent>
            
            {/* Assessments Tab */}
            <TabsContent value="assessments" className="mt-0">
              {triageResults.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-md">
                  <ClipboardList className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-4 text-gray-500">No assessments found</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => navigate(`/patients/${id}`)}
                  >
                    Create Assessment
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4 -mr-4">
                  {triageResults.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((result, index) => (
                    <Card 
                      key={index} 
                      className={`mb-3 
                        ${result.priority === "red" 
                          ? "bg-red-50 border-red-100" 
                          : result.priority === "yellow" 
                          ? "bg-yellow-50 border-yellow-100" 
                          : "bg-green-50 border-green-100"
                        }
                      `}
                    >
                      <CardContent className="p-4">
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
                          
                          <div className="mt-3 flex justify-end">
                            {hasConsultationForAssessment(result.symptoms) ? (
                              <Button 
                                variant="link" 
                                size="sm"
                                className="text-primary p-0 h-auto font-medium"
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (patient) {
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
                                  }
                                }}
                              >
                                Create Consultation
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              )}
            </TabsContent>
            
            {/* Appointments Tab */}
            <TabsContent value="appointments" className="mt-0">
              {appointments.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-md">
                  <Calendar className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-4 text-gray-500">No appointments found</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => navigate(`/appointments`)}
                  >
                    Create Appointment
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4 -mr-4">
                  {appointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(appointment => (
                    <Card key={appointment.id} className="mb-3 hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="space-y-1">
                            <p className="font-medium">{appointment.type}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {formatDate(appointment.date)}
                              
                              <Clock className="h-3 w-3 ml-2" />
                              {appointment.time}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              appointment.status === "scheduled" 
                                ? "border-blue-500 text-blue-500" 
                                : appointment.status === "completed" 
                                ? "border-green-500 text-green-500" 
                                : "border-red-500 text-red-500"
                            }
                          >
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </Badge>
                        </div>
                        
                        {appointment.notes && (
                          <div className="mt-2 text-sm text-gray-700">
                            <p className="text-xs text-gray-500 mb-1">Notes:</p>
                            <p>{appointment.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="text-center py-10">
          <p>Patient not found</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate("/patients")}
          >
            Back to Patients
          </Button>
        </div>
      )}
    </MobileLayout>
  );
};

export default PatientHistory;