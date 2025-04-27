import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import AppNavigation from "@/components/AppNavigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, AlertCircle, ArrowRight, ListFilter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  generateConsultation, 
  getConsultations, 
  saveConsultation, 
  testGroqConnection,
  queueConsultation,
  getQueuedConsultations,
  processConsultationQueue,
  ConsultationRequest, 
  ConsultationResponse 
} from "@/services/groqService";
import { Patient } from "@/types/patient";

// Define the consultation type for our application
interface Consultation {
  id: string;
  patientId: string;
  patientName: string;
  symptoms: string;
  status: "active" | "pending" | "completed";
  priority: "high" | "medium" | "low";
  createdAt: string;
  lastMessage: string;
  response?: ConsultationResponse;
  vitalSigns?: Record<string, string>;
}

const Consult = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isNewConsultOpen, setIsNewConsultOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "pending" | "completed">("all");
  const [connectionStatus, setConnectionStatus] = useState<{
    checked: boolean;
    connected: boolean;
    message: string;
  }>({
    checked: false,
    connected: false,
    message: "Checking connection..."
  });

  // New consultation form state
  const [formData, setFormData] = useState<{
    patientId: string;
    symptoms: string;
    temperature: string;
    respiratoryRate: string;
    bloodPressure: string;
    heartRate: string;
    additionalNotes: string;
  }>({
    patientId: "",
    symptoms: "",
    temperature: "",
    respiratoryRate: "",
    bloodPressure: "",
    heartRate: "",
    additionalNotes: "",
  });

  // Add state for offline mode and queued consultations
  const [isOffline, setIsOffline] = useState(false);
  const [queuedConsultations, setQueuedConsultations] = useState<any[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  const checkGroqConnection = async () => {
    try {
      const result = await testGroqConnection();
      setConnectionStatus({
        checked: true,
        connected: result.connected,
        message: result.message
      });
      return result.connected;
    } catch (error) {
      setConnectionStatus({
        checked: true,
        connected: false,
        message: "Error checking connection"
      });
      return false;
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    const auth = localStorage.getItem("kenya-chw-auth");
    if (!auth) {
      navigate("/");
      return;
    }

    // Load patients
    const storedPatients = localStorage.getItem("kenya-chw-patients");
    if (storedPatients) {
      setPatients(JSON.parse(storedPatients));
    }

    // Check Groq connection
    checkGroqConnection();

    // Check if there's a pending consultation creation request
    const pendingConsultation = localStorage.getItem("create-consultation");
    if (pendingConsultation) {
      try {
        const consultData = JSON.parse(pendingConsultation);
        
        // Populate the form with the patient data
        setFormData({
          ...formData,
          patientId: consultData.patientId,
        });
        
        // Remove the pending consultation data
        localStorage.removeItem("create-consultation");
        
        // Open the new consultation dialog
        setIsNewConsultOpen(true);
      } catch (error) {
        console.error("Error processing pending consultation:", error);
      }
    }

    // Load actual consultations from localStorage
    const loadConsultations = async () => {
      setIsLoading(true);
      try {
        const storedConsultations = getConsultations();
        
        // If no consultations exist, create sample ones
        if (!storedConsultations || storedConsultations.length === 0) {
      const mockConsultations = [
        {
          id: "CON-001",
              patientId: "CHW-001234",
          patientName: "Jane Wambui",
              symptoms: "Patient has severe breathing difficulty and high fever",
              status: "active" as const,
              priority: "high" as const,
              createdAt: new Date().toISOString(),
          lastMessage: "Patient has severe breathing difficulty and high fever",
        },
        {
          id: "CON-002",
              patientId: "CHW-004567",
          patientName: "James Odhiambo",
              symptoms: "Patient with persistent cough for 2 weeks",
              status: "pending" as const,
              priority: "medium" as const,
              createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          lastMessage: "Patient with persistent cough for 2 weeks",
        },
        {
          id: "CON-003",
              patientId: "CHW-005678",
          patientName: "Sarah Mutua",
              symptoms: "Follow-up on previous malaria treatment",
              status: "completed" as const,
              priority: "low" as const,
              createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          lastMessage: "Follow-up on previous malaria treatment",
        },
      ];
      
          // Save mock consultations
          localStorage.setItem("kenya-chw-consultations", JSON.stringify(mockConsultations));
      setConsultations(mockConsultations);
        } else {
          setConsultations(storedConsultations);
        }
      } catch (error) {
        console.error("Error loading consultations:", error);
        toast({
          title: "Error",
          description: "Failed to load consultations",
          variant: "destructive",
        });
      } finally {
      setIsLoading(false);
      }
    };

    loadConsultations();
  }, [navigate, toast]);

  // Handle opening the consultation detail dialog
  const handleConsultationSelect = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setIsDetailOpen(true);
  };

  // Handle creating a new consultation
  const handleCreateConsultation = async () => {
    if (!formData.patientId || !formData.symptoms) {
      toast({
        title: "Required fields missing",
        description: "Please select a patient and enter symptoms",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Find patient details
      const patient = patients.find(p => p.id === formData.patientId);
      if (!patient) {
        throw new Error("Patient not found");
      }

      // Calculate age from date of birth
      const birthDate = new Date(patient.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Prepare consultation request
      const request: ConsultationRequest = {
        patientId: formData.patientId,
        patientInfo: {
          name: patient.name,
          age,
          gender: patient.gender,
          medicalHistory: patient.medicalHistory,
          chronicConditions: patient.chronicConditions,
          allergies: patient.allergies,
          medications: patient.medications,
          village: patient.village,
          pregnancyStatus: patient.gender === 'female' ? patient.pregnancyStatus : undefined,
        },
        symptoms: formData.symptoms,
        vitalSigns: {
          temperature: formData.temperature || undefined,
          respiratoryRate: formData.respiratoryRate || undefined,
          bloodPressure: formData.bloodPressure || undefined,
          heartRate: formData.heartRate || undefined,
        },
        additionalNotes: formData.additionalNotes || undefined,
      };

      // Check if we're online and connected to Groq
      if (navigator.onLine && connectionStatus.connected) {
        // Generate AI consultation
        const response = await generateConsultation(request);

        // Create new consultation object
        const newConsultation: Consultation = {
          id: `CON-${Date.now().toString().slice(-6)}`,
          patientId: formData.patientId,
          patientName: patient.name,
          symptoms: formData.symptoms,
          status: "active",
          priority: response.urgencyLevel,
          createdAt: new Date().toISOString(),
          lastMessage: formData.symptoms.slice(0, 100) + (formData.symptoms.length > 100 ? "..." : ""),
          response,
          vitalSigns: request.vitalSigns,
        };

        // Save consultation
        saveConsultation(newConsultation);

        // Update state
        setConsultations(prev => [newConsultation, ...prev]);
        
        // Close dialog and show success toast
        setIsNewConsultOpen(false);
        toast({
          title: "Consultation created",
          description: "AI assessment generated successfully",
        });

        // Reset form
        setFormData({
          patientId: "",
          symptoms: "",
          temperature: "",
          respiratoryRate: "",
          bloodPressure: "",
          heartRate: "",
          additionalNotes: "",
        });

        // Automatically open the new consultation
        setSelectedConsultation(newConsultation);
        setIsDetailOpen(true);
      } else {
        // We're offline, queue the consultation
        const consultationId = queueConsultation(request, patient.name);
        
        if (consultationId) {
          // Create placeholder consultation
          const placeholderConsultation: Consultation = {
            id: consultationId,
            patientId: formData.patientId,
            patientName: patient.name,
            symptoms: formData.symptoms,
            status: "pending",
            priority: "medium", // Default priority
            createdAt: new Date().toISOString(),
            lastMessage: formData.symptoms.slice(0, 100) + (formData.symptoms.length > 100 ? "..." : ""),
            vitalSigns: request.vitalSigns,
          };
          
          // Close dialog and show success toast
          setIsNewConsultOpen(false);
          toast({
            title: "Consultation queued",
            description: "Your consultation has been saved and will be processed when you're back online.",
          });
          
          // Update queued consultations
          const queued = getQueuedConsultations();
          setQueuedConsultations(queued);
          
          // Reset form
          setFormData({
            patientId: "",
            symptoms: "",
            temperature: "",
            respiratoryRate: "",
            bloodPressure: "",
            heartRate: "",
            additionalNotes: "",
          });
        } else {
          throw new Error("Failed to queue consultation");
        }
      }
    } catch (error) {
      console.error("Error creating consultation:", error);
      toast({
        title: "Error",
        description: "Failed to create consultation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle generating an assessment for an existing consultation
  const handleGenerateAssessment = async (consultation: Consultation, isRegeneration = false) => {
    setIsProcessing(true);

    try {
      // Find patient details
      const patient = patients.find(p => p.id === consultation.patientId);
      if (!patient) {
        throw new Error("Patient not found");
      }

      // Calculate age from date of birth
      const birthDate = new Date(patient.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Prepare consultation request
      const request: ConsultationRequest = {
        patientId: consultation.patientId,
        patientInfo: {
          name: patient.name,
          age,
          gender: patient.gender,
        },
        symptoms: consultation.symptoms,
        additionalNotes: "",
      };

      // Generate AI consultation
      const response = await generateConsultation(request);

      // Update the consultation with the new response
      const updatedConsultation = {
        ...consultation,
        response,
      };

      // Update in state
      setConsultations(prev => 
        prev.map(c => c.id === consultation.id ? updatedConsultation : c)
      );

      // Update selected consultation
      setSelectedConsultation(updatedConsultation);

      // Save to localStorage
      const allConsultations = getConsultations();
      const updatedAllConsultations = allConsultations.map(c => 
        c.id === consultation.id ? {...c, response} : c
      );
      localStorage.setItem("kenya-chw-consultations", JSON.stringify(updatedAllConsultations));

      toast({
        title: isRegeneration ? "Assessment regenerated" : "Assessment generated",
        description: `AI assessment has been successfully ${isRegeneration ? 're-created' : 'created'}`,
      });
    } catch (error) {
      console.error("Error generating assessment:", error);
      toast({
        title: "Error",
        description: "Failed to generate assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter consultations based on status
  const filteredConsultations = filter === "all" 
    ? consultations 
    : consultations.filter(c => c.status === filter);

  // Handle updating consultation status
  const handleUpdateStatus = async (consultation: Consultation, newStatus: "active" | "pending" | "completed") => {
    try {
      // Create an updated consultation
      const updatedConsultation = {
        ...consultation,
        status: newStatus
      };

      // Update in state
      setConsultations(prev => 
        prev.map(c => c.id === consultation.id ? updatedConsultation : c)
      );

      // Update selected consultation
      setSelectedConsultation(updatedConsultation);

      // Save to localStorage
      const allConsultations = getConsultations();
      const updatedAllConsultations = allConsultations.map(c => 
        c.id === consultation.id ? {...c, status: newStatus} : c
      );
      localStorage.setItem("kenya-chw-consultations", JSON.stringify(updatedAllConsultations));

      // Add activity record for completed consultations
      if (newStatus === "completed") {
        const patient = patients.find(p => p.id === consultation.patientId);
        if (patient) {
          try {
            const activityStorage = localStorage.getItem("kenya-chw-activity");
            const activities = activityStorage ? JSON.parse(activityStorage) : [];
            const newActivity = {
              id: `activity-${Date.now()}`,
              message: `Consultation completed for ${patient.name}`,
              timestamp: "just now",
              createdAt: new Date(),
              type: "follow_up",
              patientId: patient.id,
              read: false
            };
            activities.unshift(newActivity);
            localStorage.setItem("kenya-chw-activity", JSON.stringify(activities));
          } catch (error) {
            console.error("Error saving activity:", error);
          }
        }
      }

      toast({
        title: `Status updated`,
        description: `Consultation marked as ${newStatus}`
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update consultation status",
        variant: "destructive"
      });
    }
  };

  // Handle sharing the assessment via mobile share API
  const handleShareAssessment = async (consultation: Consultation) => {
    if (!consultation.response) return;

    try {
      const shareText = `
Kenya-CHW Assessment for ${consultation.patientName} (${consultation.patientId})
Created: ${formatDate(consultation.createdAt)}

SYMPTOMS:
${consultation.symptoms}

ASSESSMENT:
${consultation.response.assessment}

RECOMMENDED ACTIONS:
${consultation.response.recommendedActions.map((action, i) => `${i + 1}. ${action}`).join('\n')}

URGENCY LEVEL: ${consultation.response.urgencyLevel.toUpperCase()}

FOLLOW-UP:
${consultation.response.followUpRecommendation}

REFERRAL NEEDED: ${consultation.response.referralNeeded ? 'Yes' : 'No'}
${consultation.response.referralNeeded ? `REFERRAL REASON: ${consultation.response.referralReason}` : ''}

PATIENT EDUCATION:
${consultation.response.patientEducation}

-- Generated by Kenya-CHW App --
`;

      if (navigator.share) {
        await navigator.share({
          title: `Medical Assessment for ${consultation.patientName}`,
          text: shareText
        });
        toast({
          title: "Shared successfully",
          description: "Assessment has been shared"
        });
      } else {
        // Fallback for browsers that don't support the Share API
        navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to clipboard",
          description: "Assessment has been copied to clipboard"
        });
      }
    } catch (error) {
      console.error("Error sharing assessment:", error);
      toast({
        title: "Error",
        description: "Failed to share assessment",
        variant: "destructive"
      });
    }
  };

  // Handle printing the assessment
  const handlePrintAssessment = (consultation: Consultation) => {
    if (!consultation.response) return;

    try {
      // Create a printable version of the assessment
      const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Medical Assessment - ${consultation.patientName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.5;
            margin: 20px;
            max-width: 800px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ccc;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 16px;
            color: #333;
            background-color: #f9f9f9;
            padding: 5px 10px;
            border-left: 4px solid #0070f3;
          }
          .sub-title {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 14px;
            color: #555;
          }
          .priority-high {
            color: #e11d48;
            font-weight: bold;
          }
          .priority-medium {
            color: #eab308;
            font-weight: bold;
          }
          .priority-low {
            color: #22c55e;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #ccc;
            font-size: 12px;
            text-align: center;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          table td, table th {
            border: 1px solid #ddd;
            padding: 8px;
          }
          table tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          .vital-signs {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }
          .vital-sign {
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 4px;
          }
          .vital-sign-title {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          .vital-sign-value {
            font-size: 16px;
            font-weight: bold;
          }
          ol {
            padding-left: 20px;
          }
          li {
            margin-bottom: 5px;
          }
          @media print {
            body {
              margin: 0;
              padding: 15px;
            }
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Kenya-CHW Medical Assessment</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="section">
          <table>
            <tr>
              <th style="width: 30%;">Patient Name</th>
              <td>${consultation.patientName}</td>
            </tr>
            <tr>
              <th>Patient ID</th>
              <td>${consultation.patientId}</td>
            </tr>
            <tr>
              <th>Created On</th>
              <td>${formatDate(consultation.createdAt)}</td>
            </tr>
            <tr>
              <th>Priority</th>
              <td class="priority-${consultation.priority}">${consultation.priority.toUpperCase()}</td>
            </tr>
            <tr>
              <th>Status</th>
              <td>${consultation.status.toUpperCase()}</td>
            </tr>
          </table>
        </div>
        
        ${consultation.vitalSigns && Object.values(consultation.vitalSigns).some(value => value !== "") ? `
        <div class="section">
          <div class="section-title">VITAL SIGNS</div>
          <div class="vital-signs">
            ${Object.entries(consultation.vitalSigns)
              .filter(([_, value]) => value !== "")
              .map(([key, value]) => {
                const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
                return `
                <div class="vital-sign">
                  <div class="vital-sign-title">${formattedKey}</div>
                  <div class="vital-sign-value">${value}</div>
                </div>
                `;
              }).join('')}
          </div>
        </div>
        ` : ''}
        
        <div class="section">
          <div class="section-title">SYMPTOMS</div>
          <p>${consultation.symptoms}</p>
        </div>
        
        <div class="section">
          <div class="section-title">CLINICAL ASSESSMENT</div>
          <p>${consultation.response.assessment}</p>
        </div>
        
        <div class="section">
          <div class="section-title">RECOMMENDED ACTIONS</div>
          <ol>
            ${consultation.response.recommendedActions.map(action => `<li>${action}</li>`).join('')}
          </ol>
        </div>
        
        <div class="section">
          <div class="section-title">URGENCY LEVEL</div>
          <p class="priority-${consultation.priority}">${consultation.priority.toUpperCase()} PRIORITY</p>
        </div>
        
        <div class="section">
          <div class="section-title">FOLLOW-UP PLAN</div>
          <p>${consultation.response.followUpRecommendation}</p>
        </div>
        
        <div class="section">
          <div class="section-title">REFERRAL</div>
          <p><strong>${consultation.response.referralNeeded ? 'Required' : 'Not Required'}</strong></p>
          ${consultation.response.referralNeeded && consultation.response.referralReason ? `
          <div class="sub-title">Reason for Referral:</div>
          <p>${consultation.response.referralReason}</p>
          ` : ''}
        </div>
        
        <div class="section">
          <div class="section-title">PATIENT EDUCATION</div>
          <p>${consultation.response.patientEducation}</p>
        </div>
        
        ${consultation.response.differentialDiagnoses?.length ? `
        <div class="section">
          <div class="section-title">DIFFERENTIAL DIAGNOSES</div>
          <ul>
            ${consultation.response.differentialDiagnoses.map(diagnosis => `<li>${diagnosis}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        
        ${consultation.response.medicationRecommendations?.length ? `
        <div class="section">
          <div class="section-title">MEDICATION RECOMMENDATIONS</div>
          ${consultation.response.medicationRecommendations.map(med => `
            <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
              <div style="font-weight: bold;">${med.name}</div>
              <div style="margin-top: 5px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px;">
                <div><span style="color: #666; font-size: 12px;">Dosage:</span> ${med.dosage}</div>
                <div><span style="color: #666; font-size: 12px;">Frequency:</span> ${med.frequency}</div>
                <div><span style="color: #666; font-size: 12px;">Duration:</span> ${med.duration}</div>
                ${med.notes ? `<div><span style="color: #666; font-size: 12px;">Notes:</span> ${med.notes}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        ${consultation.response.redFlags?.length ? `
        <div class="section">
          <div class="section-title">WARNING SIGNS - SEEK IMMEDIATE CARE IF:</div>
          <ul>
            ${consultation.response.redFlags.map(flag => `<li style="color: #e11d48;">${flag}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        
        ${consultation.response.homeRemedies?.length ? `
        <div class="section">
          <div class="section-title">HOME CARE RECOMMENDATIONS</div>
          <ul>
            ${consultation.response.homeRemedies.map(remedy => `<li>${remedy}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        
        ${consultation.response.preventionAdvice ? `
        <div class="section">
          <div class="section-title">PREVENTION ADVICE</div>
          <p>${consultation.response.preventionAdvice}</p>
        </div>
        ` : ''}
        
        <div class="footer">
          <p>Generated by Kenya-CHW Mobile Health Assistant</p>
          <button onclick="window.print();" style="padding: 8px 16px; margin-top: 10px;">Print Document</button>
        </div>
      </body>
      </html>
      `;

      // Open a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Trigger print once content is loaded
        printWindow.onload = function() {
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      } else {
        toast({
          title: "Pop-up Blocked",
          description: "Please allow pop-ups to print the assessment",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error printing assessment:", error);
      toast({
        title: "Error",
        description: "Failed to prepare document for printing",
        variant: "destructive"
      });
    }
  };

  // Add to useEffect to check for internet connection and queued consultations
  useEffect(() => {
    // Check online status
    const handleOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
      if (navigator.onLine) {
        checkGroqConnection();
      } else {
        setConnectionStatus({
          checked: true,
          connected: false,
          message: "You are offline"
        });
      }
    };

    // Add event listeners for online/offline events
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    // Initial check
    handleOnlineStatus();
    
    // Load queued consultations
    const loadQueuedConsultations = () => {
      const queued = getQueuedConsultations();
      setQueuedConsultations(queued);
    };
    
    loadQueuedConsultations();
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  // Add a function to process the consultation queue
  const handleProcessQueue = async () => {
    if (!navigator.onLine || !connectionStatus.connected) {
      toast({
        title: "Cannot process queue",
        description: "You must be online with a working Groq connection to process queued consultations.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessingQueue(true);
    
    try {
      const results = await processConsultationQueue();
      
      // Refresh consultations and queue
      const consultations = getConsultations();
      setConsultations(consultations);
      const queued = getQueuedConsultations();
      setQueuedConsultations(queued);
      
      toast({
        title: "Queue processed",
        description: `Successfully processed ${results.success} consultations. ${results.failed} failed.`,
        variant: results.failed > 0 ? "destructive" : "default"
      });
    } catch (error) {
      console.error("Error processing queue:", error);
      toast({
        title: "Error",
        description: "Failed to process queued consultations.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingQueue(false);
    }
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
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Consultations</h2>
              <div className="flex items-center text-sm">
                <span className="mr-2">Status:</span>
                {isOffline ? (
                  <span className="flex items-center text-amber-600">
                    <div className="h-2 w-2 bg-amber-600 rounded-full mr-1"></div>
                    Offline
                  </span>
                ) : !connectionStatus.checked ? (
                  <span className="flex items-center">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Checking...
                  </span>
                ) : connectionStatus.connected ? (
                  <span className="flex items-center text-green-600">
                    <div className="h-2 w-2 bg-green-600 rounded-full mr-1"></div>
                    Connected
                  </span>
                ) : (
                  <div className="flex items-center">
                    <span className="flex items-center text-red-600 mr-2">
                      <div className="h-2 w-2 bg-red-600 rounded-full mr-1"></div>
                      {connectionStatus.message.includes("API error") ? "API Error" : "Not Connected"}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={checkGroqConnection}
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <ListFilter className="h-4 w-4 text-gray-500" />
                <Select
                  value={filter}
                  onValueChange={(value) => setFilter(value as any)}
                >
                  <SelectTrigger className="w-[130px] h-8">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="flex items-center gap-1"
                onClick={() => setIsNewConsultOpen(true)}
              >
                <Plus className="h-4 w-4" />
                New Consult
              </Button>
            </div>

            {filteredConsultations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No consultations found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {filter !== "all" 
                    ? `No ${filter} consultations available.` 
                    : "Start by creating a new consultation."}
                </p>
                <Button 
                  variant="outline"
                  onClick={() => setIsNewConsultOpen(true)}
                >
                  Create New Consultation
                </Button>
              </div>
            ) : (
              <div>
                {filteredConsultations.map(consultation => (
              <Card 
                key={consultation.id} 
                    className="mb-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleConsultationSelect(consultation)}
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
                  
                      <div className="flex items-center text-primary text-sm font-medium">
                        View Details <ArrowRight className="h-4 w-4 ml-1" />
                      </div>
                </CardFooter>
              </Card>
            ))}
            </div>
            )}

            {/* Add queued consultations section if any exist */}
            {queuedConsultations.length > 0 && (
              <Card className="mt-6 bg-amber-50 border-amber-200">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                      </svg>
                      Offline Consultations
                    </CardTitle>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="bg-amber-200 hover:bg-amber-300 text-amber-800"
                      disabled={isProcessingQueue || !navigator.onLine || !connectionStatus.connected}
                      onClick={handleProcessQueue}
                    >
                      {isProcessingQueue ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"></path>
                          </svg>
                          Process Queue
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-amber-700">
                    {queuedConsultations.length} consultation{queuedConsultations.length !== 1 ? 's' : ''} waiting to be processed when online
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {queuedConsultations.map(item => (
                      <div key={item.id} className="flex justify-between p-3 bg-white border border-amber-200 rounded-md">
                        <div>
                          <p className="font-medium">{item.patientName}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{item.request.symptoms}</p>
                          <p className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                        <Badge variant="outline" className="h-fit border-amber-500 text-amber-600">
                          Queued
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </MobileLayout>

      {/* New Consultation Dialog */}
      <Dialog open={isNewConsultOpen} onOpenChange={setIsNewConsultOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Consultation</DialogTitle>
            <DialogDescription>
              Enter patient symptoms and vital signs to generate an AI-assisted medical assessment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="patient" className="text-sm font-medium">
                Patient *
              </label>
              <Select
                value={formData.patientId}
                onValueChange={(value) => setFormData({...formData, patientId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(patient => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} ({patient.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="symptoms" className="text-sm font-medium">
                Symptoms *
              </label>
              <Textarea
                id="symptoms"
                placeholder="Describe the patient's symptoms in detail"
                value={formData.symptoms}
                onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                className="resize-none min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="temperature" className="text-sm font-medium">
                  Temperature (°C)
                </label>
                <Input
                  id="temperature"
                  placeholder="e.g., 37.5"
                  value={formData.temperature}
                  onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="respiratoryRate" className="text-sm font-medium">
                  Respiratory Rate
                </label>
                <Input
                  id="respiratoryRate"
                  placeholder="e.g., 18"
                  value={formData.respiratoryRate}
                  onChange={(e) => setFormData({...formData, respiratoryRate: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="bloodPressure" className="text-sm font-medium">
                  Blood Pressure
                </label>
                <Input
                  id="bloodPressure"
                  placeholder="e.g., 120/80"
                  value={formData.bloodPressure}
                  onChange={(e) => setFormData({...formData, bloodPressure: e.target.value})}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="heartRate" className="text-sm font-medium">
                  Heart Rate
                </label>
                <Input
                  id="heartRate"
                  placeholder="e.g., 72"
                  value={formData.heartRate}
                  onChange={(e) => setFormData({...formData, heartRate: e.target.value})}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="additionalNotes" className="text-sm font-medium">
                Additional Notes
              </label>
              <Textarea
                id="additionalNotes"
                placeholder="Any other relevant information"
                value={formData.additionalNotes}
                onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsNewConsultOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateConsultation}
              disabled={isProcessing || !formData.patientId || !formData.symptoms}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Generate Assessment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consultation Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {selectedConsultation && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>Consultation Details</DialogTitle>
                  <Badge
                    className={
                      selectedConsultation.priority === "high" 
                        ? "bg-destructive" 
                        : selectedConsultation.priority === "medium" 
                        ? "bg-yellow-500" 
                        : "bg-green-500"
                    }
                  >
                    {selectedConsultation.priority === "high" 
                      ? "High Priority" 
                      : selectedConsultation.priority === "medium" 
                      ? "Medium Priority" 
                      : "Low Priority"
                    }
                  </Badge>
                </div>
                <DialogDescription>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {selectedConsultation.patientName} ({selectedConsultation.patientId})
                    </span>
                    <span className="text-xs">
                      {formatDate(selectedConsultation.createdAt)}
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100">
                  <h3 className="text-sm font-semibold mb-2 text-gray-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                    </svg>
                    Patient Symptoms
                  </h3>
                  <p className="text-sm">{selectedConsultation.symptoms}</p>
                </div>

                {selectedConsultation.vitalSigns && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Vital Signs:</h4>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {Object.entries(selectedConsultation.vitalSigns).filter(([_, value]) => value !== "").map(([key, value]) => {
                        const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
                        // Get appropriate icon and color based on key
                        let icon = null;
                        let colorClass = "";
                        
                        // Determine if value is out of normal range and set color accordingly
                        const isOutOfRange = () => {
                          if (key === "bloodPressure") {
                            const [systolic, diastolic] = value.split('/').map(Number);
                            return systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60;
                          } else if (key === "heartRate") {
                            const rate = Number(value);
                            return rate > 100 || rate < 60;
                          } else if (key === "temperature") {
                            const temp = Number(value);
                            return temp > 37.8 || temp < 36.0;
                          } else if (key === "respiratoryRate") {
                            const rate = Number(value);
                            return rate > 20 || rate < 12;
                          } else if (key === "oxygenSaturation") {
                            const sat = Number(value);
                            return sat < 95;
                          }
                          return false;
                        };
                        
                        colorClass = isOutOfRange() ? "text-red-500" : "text-green-500";
                        
                        if (key === "bloodPressure") {
                          icon = (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                          );
                        } else if (key === "heartRate") {
                          icon = (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                          );
                        } else if (key === "temperature") {
                          icon = (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>
                          );
                        } else if (key === "respiratoryRate") {
                          icon = (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M8 2v5"/><circle cx="12" cy="10" r="3"/><path d="M16 2v5"/><path d="M8 22v-5"/><path d="M16 22v-5"/><path d="M8 17h8"/><path d="M8 7h8"/></svg>
                          );
                        } else if (key === "oxygenSaturation") {
                          icon = (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="10"/><path d="M8 12a4 4 0 0 1 8 0"/></svg>
                          );
                        } else if (key === "weight") {
                          icon = (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="5" r="3"/><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"/></svg>
                          );
                        }
                        
                        return (
                          <div key={key} className={`p-2 border rounded-md flex items-center ${colorClass}`}>
                            {icon}
                            <div>
                              <div className="text-xs font-medium text-muted-foreground">{formattedKey}</div>
                              <div className="font-semibold">{value}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedConsultation.response ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-md font-semibold text-primary">AI Assessment</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs h-8 flex items-center"
                        onClick={() => handleGenerateAssessment(selectedConsultation, true)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
                          </svg>
                        )}
                        Regenerate
                      </Button>
                    </div>

                    <div className="bg-white rounded-lg p-4 border-l-4 border-primary shadow-sm">
                      <h3 className="text-sm font-semibold mb-2 text-gray-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="M8 2v4m8-4v4M3 10h18M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"></path>
                        </svg>
                        Clinical Assessment
                      </h3>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{selectedConsultation.response.assessment}</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border-l-4 border-secondary shadow-sm">
                      <h3 className="text-sm font-semibold mb-2 text-gray-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                          <path d="M9 2h6a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"></path>
                          <path d="m9 14 2 2 4-4"></path>
                        </svg>
                        Recommended Actions
                      </h3>
                      <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
                        {selectedConsultation.response.recommendedActions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border-l-4 border-blue-400 shadow-sm">
                        <h3 className="text-sm font-semibold mb-2 text-gray-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M3 3v18h18"/>
                            <path d="M18.4 9a9 9 0 1 1-6.9 6.9"/>
                          </svg>
                          Follow-up Plan
                        </h3>
                        <p className="text-sm text-gray-700">
                          {selectedConsultation.response.followUpRecommendation}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border-l-4 border-red-400 shadow-sm">
                        <h3 className="text-sm font-semibold mb-2 text-gray-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                          Referral Status
                        </h3>
                        <div className="flex items-center mb-2">
                          <Badge variant={selectedConsultation.response.referralNeeded ? "destructive" : "outline"} className="mb-2">
                            {selectedConsultation.response.referralNeeded ? "Referral Required" : "No Referral Needed"}
                          </Badge>
                        </div>
                        {selectedConsultation.response.referralNeeded && selectedConsultation.response.referralReason && (
                          <div>
                            <h4 className="text-xs font-semibold mb-1 text-gray-600">Reason for Referral:</h4>
                            <p className="text-sm text-gray-700">
                              {selectedConsultation.response.referralReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border-l-4 border-accent shadow-sm">
                      <h3 className="text-sm font-semibold mb-2 text-gray-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"/>
                          <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"/>
                        </svg>
                        Patient Education
                      </h3>
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {selectedConsultation.response.patientEducation}
                      </p>
                    </div>

                    {selectedConsultation.response?.differentialDiagnoses?.length && (
                      <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-400 shadow-sm">
                        <h3 className="text-sm font-semibold mb-2 text-gray-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M5 12h14"></path><path d="M12 5v14"></path>
                          </svg>
                          Differential Diagnoses
                        </h3>
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          {selectedConsultation.response.differentialDiagnoses.map((diagnosis, idx) => (
                            <li key={idx}>{diagnosis}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedConsultation.response?.medicationRecommendations?.length && (
                      <div className="bg-white rounded-lg p-4 border-l-4 border-blue-400 shadow-sm">
                        <h3 className="text-sm font-semibold mb-2 text-gray-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="m19 14-7 7-7-7"></path><path d="M12 3v14"></path>
                          </svg>
                          Medication Recommendations
                        </h3>
                        <div className="space-y-3">
                          {selectedConsultation.response.medicationRecommendations.map((med, idx) => (
                            <div key={idx} className="bg-gray-50 p-3 rounded-md">
                              <div className="font-medium">{med.name}</div>
                              <div className="text-xs grid grid-cols-2 gap-2 mt-1">
                                <div>
                                  <span className="text-gray-500">Dosage:</span> {med.dosage}
                                </div>
                                <div>
                                  <span className="text-gray-500">Frequency:</span> {med.frequency}
                                </div>
                                <div>
                                  <span className="text-gray-500">Duration:</span> {med.duration}
                                </div>
                                {med.notes && (
                                  <div className="col-span-2">
                                    <span className="text-gray-500">Notes:</span> {med.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedConsultation.response?.redFlags?.length && (
                      <div className="bg-white rounded-lg p-4 border-l-4 border-red-500 shadow-sm">
                        <h3 className="text-sm font-semibold mb-2 text-red-600 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12" y2="17"></line>
                          </svg>
                          Warning Signs
                        </h3>
                        <p className="text-sm text-gray-700 mb-2">Seek immediate medical attention if any of these symptoms appear:</p>
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          {selectedConsultation.response.redFlags.map((flag, idx) => (
                            <li key={idx} className="text-red-600">{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedConsultation.response?.homeRemedies?.length && (
                      <div className="bg-white rounded-lg p-4 border-l-4 border-green-400 shadow-sm">
                        <h3 className="text-sm font-semibold mb-2 text-gray-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path>
                            <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"></path>
                            <path d="M12 3v6"></path>
                          </svg>
                          Home Care
                        </h3>
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          {selectedConsultation.response.homeRemedies.map((remedy, idx) => (
                            <li key={idx}>{remedy}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedConsultation.response?.preventionAdvice && (
                      <div className="bg-white rounded-lg p-4 border-l-4 border-purple-400 shadow-sm">
                        <h3 className="text-sm font-semibold mb-2 text-gray-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path>
                          </svg>
                          Prevention Advice
                        </h3>
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {selectedConsultation.response.preventionAdvice}
                        </p>
                      </div>
                    )}

                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm mt-4">
                      <h3 className="text-sm font-semibold mb-2 text-gray-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path>
                        </svg>
                        Urgency Level
                      </h3>
                      <div className="flex items-center">
                        <Badge 
                          className={
                            selectedConsultation.priority === "high" 
                              ? "bg-destructive" 
                              : selectedConsultation.priority === "medium" 
                              ? "bg-yellow-500" 
                              : "bg-green-500"
                          }
                        >
                          {selectedConsultation.priority.toUpperCase()} PRIORITY
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-4">
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold mb-3 text-gray-700">Update Status</h3>
                        <div className="flex space-x-2">
                          <Button
                            variant={selectedConsultation.status === "active" ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => handleUpdateStatus(selectedConsultation, "active")}
                            disabled={selectedConsultation.status === "active"}
                          >
                            Active
                          </Button>
                          <Button
                            variant={selectedConsultation.status === "pending" ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => handleUpdateStatus(selectedConsultation, "pending")}
                            disabled={selectedConsultation.status === "pending"}
                          >
                            Pending
                          </Button>
                          <Button
                            variant={selectedConsultation.status === "completed" ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => handleUpdateStatus(selectedConsultation, "completed")}
                            disabled={selectedConsultation.status === "completed"}
                          >
                            Completed
                          </Button>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 flex items-center justify-center"
                          onClick={() => handleShareAssessment(selectedConsultation)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                            <polyline points="16 6 12 2 8 6"></polyline>
                            <line x1="12" y1="2" x2="12" y2="15"></line>
                          </svg>
                          Share
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 flex items-center justify-center"
                          onClick={() => handlePrintAssessment(selectedConsultation)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                          </svg>
                          Print
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6">
                    <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">AI Assessment Not Available</h3>
                    <p className="text-sm text-gray-500 text-center mb-4">
                      This consultation does not have an AI assessment yet.
                    </p>
                    <Button 
                      onClick={() => handleGenerateAssessment(selectedConsultation)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate Assessment Now"
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter className="flex justify-between space-x-4 pt-2 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    navigate(`/patients/${selectedConsultation.patientId}`);
                  }}
                  className="flex-1"
                >
                  View Patient
                </Button>
                <Button 
                  onClick={() => setIsDetailOpen(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AppNavigation />
    </div>
  );
};

export default Consult;
