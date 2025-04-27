import { Patient } from "@/types/patient";

// Define consultation types
export interface ConsultationRequest {
  patientId: string;
  patientInfo: {
    name: string;
    age: number;
    gender: string;
    medicalHistory?: string;
    village?: string; // Location context is important for endemic diseases
    weight?: string;
    height?: string;
    chronicConditions?: string[];
    allergies?: string[];
    medications?: string[]; // Current medications
    pregnancyStatus?: string; // For female patients
  };
  symptoms: string;
  vitalSigns?: {
    temperature?: string;
    bloodPressure?: string;
    heartRate?: string;
    respiratoryRate?: string;
    oxygenSaturation?: string;
    weight?: string;
    bmi?: string;
  };
  additionalNotes?: string;
  previousConsultations?: {
    date: string;
    symptoms: string;
    diagnosis?: string;
    treatment?: string;
  }[];
  previousTriageResults?: {
    date: string;
    symptoms: string;
    priority: string;
    vitalSigns?: Record<string, string>;
  }[];
}

export interface ConsultationResponse {
  assessment: string;
  recommendedActions: string[];
  urgencyLevel: "low" | "medium" | "high";
  followUpRecommendation: string;
  patientEducation: string;
  referralNeeded: boolean;
  referralReason?: string;
  differentialDiagnoses?: string[]; // Possible alternate diagnoses
  medicationRecommendations?: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
  }[];
  warningsAndContraindications?: string[]; // Important warnings about treatment
  redFlags?: string[]; // Symptoms that would indicate worsening condition
  homeRemedies?: string[]; // Culturally appropriate home care options
  preventionAdvice?: string; // Prevention advice for similar conditions
}

// Environment variables - in real production app you would use a .env file
const GROQ_API_KEY = "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"; 
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama3-70b-8192"; // Using Llama 3 70B model which is good for medical context

// Kenya-specific medical context for the prompt
const KENYA_MEDICAL_CONTEXT = `
You are an AI medical assistant helping Community Health Workers (CHWs) in rural Kenya. 
Consider the following contextual information:
- CHWs in Kenya work in resource-limited settings with minimal equipment
- Common diseases include malaria, pneumonia, diarrheal diseases, TB, and HIV
- Many patients have limited access to healthcare facilities
- Medications and treatments recommended should be available in rural Kenya
- Your guidance should be tailored to what CHWs can realistically provide in remote areas
- Your assessment should be culturally appropriate for Kenyan patients

IMPORTANT: When responding to consultations, you MUST format your answers as valid, parseable JSON 
following the exact structure provided in the user prompt. This ensures the CHW mobile application 
can properly display your assessment to healthcare workers.

Never include explanations, text, or comments outside of the JSON structure.
`;

/**
 * Queue to store consultation requests when offline
 */
interface QueuedConsultation {
  request: ConsultationRequest;
  patientName: string;
  timestamp: string;
  id: string;
}

/**
 * Save a consultation request to the offline queue
 */
export const queueConsultation = (request: ConsultationRequest, patientName: string): string => {
  try {
    const id = `OFFLINE-${Date.now()}`;
    const queuedConsultation: QueuedConsultation = {
      request,
      patientName,
      timestamp: new Date().toISOString(),
      id
    };
    
    // Get existing queue
    const existingQueue = localStorage.getItem("kenya-chw-consultation-queue");
    const queue = existingQueue ? JSON.parse(existingQueue) : [];
    
    // Add new request to queue
    queue.push(queuedConsultation);
    
    // Save updated queue
    localStorage.setItem("kenya-chw-consultation-queue", JSON.stringify(queue));
    
    return id;
  } catch (error) {
    console.error("Error queuing consultation:", error);
    return "";
  }
};

/**
 * Get all queued consultations
 */
export const getQueuedConsultations = (): QueuedConsultation[] => {
  try {
    const queue = localStorage.getItem("kenya-chw-consultation-queue");
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error("Error getting queued consultations:", error);
    return [];
  }
};

/**
 * Remove a consultation from the queue
 */
export const removeFromQueue = (id: string): boolean => {
  try {
    const queue = getQueuedConsultations();
    const updatedQueue = queue.filter(item => item.id !== id);
    localStorage.setItem("kenya-chw-consultation-queue", JSON.stringify(updatedQueue));
    return true;
  } catch (error) {
    console.error("Error removing from queue:", error);
    return false;
  }
};

/**
 * Process offline queue when online
 */
export const processConsultationQueue = async (): Promise<{success: number, failed: number}> => {
  const queue = getQueuedConsultations();
  const results = {success: 0, failed: 0};
  
  for (const item of queue) {
    try {
      // Try to generate consultation
      const response = await generateConsultation(item.request);
      
      // Create new consultation object
      const consultation = {
        id: item.id.replace('OFFLINE-', 'CON-'),
        patientId: item.request.patientId,
        patientName: item.patientName,
        symptoms: item.request.symptoms,
        status: "active" as const,
        priority: response.urgencyLevel,
        createdAt: item.timestamp,
        lastMessage: item.request.symptoms.slice(0, 100) + (item.request.symptoms.length > 100 ? "..." : ""),
        response,
        vitalSigns: item.request.vitalSigns,
      };
      
      // Save consultation
      saveConsultation(consultation);
      
      // Remove from queue
      removeFromQueue(item.id);
      
      results.success++;
    } catch (error) {
      console.error(`Error processing queued consultation ${item.id}:`, error);
      results.failed++;
    }
  }
  
  return results;
};

/**
 * Generate a consultation response using Groq's LLM API
 */
export const generateConsultation = async (request: ConsultationRequest): Promise<ConsultationResponse> => {
  try {
    // Extract age from date of birth if given patient object
    const getPatientInfo = async (patientId: string) => {
      try {
        const storedPatients = localStorage.getItem("kenya-chw-patients");
        if (storedPatients) {
          const patients: Patient[] = JSON.parse(storedPatients);
          const patient = patients.find(p => p.id === patientId);
          if (patient) {
            // Calculate age from dateOfBirth
            const birthDate = new Date(patient.dateOfBirth);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }

            // Get previous consultations
            const previousConsultations = [];
            try {
              const storedConsultations = localStorage.getItem("kenya-chw-consultations");
              if (storedConsultations) {
                const allConsults = JSON.parse(storedConsultations);
                const patientConsults = allConsults
                  .filter(c => c.patientId === patientId)
                  .slice(0, 3) // Get the 3 most recent consultations
                  .map(c => ({
                    date: new Date(c.createdAt).toLocaleDateString(),
                    symptoms: c.symptoms,
                    diagnosis: c.response?.assessment?.split('.')[0] || '', // Get first sentence of assessment as diagnosis
                    treatment: c.response?.recommendedActions?.join(', ') || ''
                  }));
                previousConsultations.push(...patientConsults);
              }
            } catch (err) {
              console.error("Error getting previous consultations:", err);
            }

            // Get previous triage results
            const previousTriageResults = [];
            try {
              const storedTriageResults = localStorage.getItem("kenya-chw-triage-results");
              if (storedTriageResults) {
                const allResults = JSON.parse(storedTriageResults);
                const patientResults = allResults
                  .filter(r => r.patientId === patientId)
                  .slice(0, 3) // Get the 3 most recent triage results
                  .map(r => ({
                    date: new Date(r.timestamp).toLocaleDateString(),
                    symptoms: r.symptoms,
                    priority: r.priority,
                    vitalSigns: {
                      temperature: r.temperature,
                      respiratoryRate: r.respiratoryRate
                    }
                  }));
                previousTriageResults.push(...patientResults);
              }
            } catch (err) {
              console.error("Error getting triage results:", err);
            }

            return {
              name: patient.name,
              age,
              gender: patient.gender,
              village: patient.village,
              medicalHistory: patient.medicalHistory || '',
              chronicConditions: patient.chronicConditions || [],
              allergies: patient.allergies || [],
              previousConsultations: previousConsultations.length > 0 ? previousConsultations : undefined,
              previousTriageResults: previousTriageResults.length > 0 ? previousTriageResults : undefined
            };
          }
        }
        return null;
      } catch (error) {
        console.error("Error getting patient info:", error);
        return null;
      }
    };

    // Get additional patient info if not provided
    if (!request.patientInfo.name) {
      const patientInfo = await getPatientInfo(request.patientId);
      if (patientInfo) {
        request.patientInfo = {
          ...request.patientInfo,
          ...patientInfo
        };
      }
    }

    // Construct the prompt for the LLM
    const prompt = constructMedicalPrompt(request);

    // Make the API call to Groq
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: KENYA_MEDICAL_CONTEXT
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more deterministic medical advice
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Parse the AI response to extract structured information
    return parseAIResponse(aiResponse);
  } catch (error) {
    console.error("Error in Groq API call:", error);
    // Return a fallback response if API call fails
    return {
      assessment: "Unable to generate assessment due to technical issues. Please try again later.",
      recommendedActions: ["Refer the patient to a healthcare facility"],
      urgencyLevel: "medium",
      followUpRecommendation: "Follow up within 24 hours",
      patientEducation: "Please seek medical attention if symptoms worsen",
      referralNeeded: true,
      referralReason: "Technical issue with consultation service"
    };
  }
};

/**
 * Construct a detailed medical prompt based on the consultation request
 */
const constructMedicalPrompt = (request: ConsultationRequest): string => {
  const { patientInfo, symptoms, vitalSigns, additionalNotes } = request;

  // Format medical history if available
  let medicalHistorySection = "";
  if (patientInfo.medicalHistory || patientInfo.chronicConditions?.length || patientInfo.allergies?.length || patientInfo.medications?.length) {
    medicalHistorySection = `MEDICAL HISTORY:
${patientInfo.medicalHistory ? `- Past Medical History: ${patientInfo.medicalHistory}` : ""}
${patientInfo.chronicConditions?.length ? `- Chronic Conditions: ${patientInfo.chronicConditions.join(", ")}` : ""}
${patientInfo.allergies?.length ? `- Allergies: ${patientInfo.allergies.join(", ")}` : ""}
${patientInfo.medications?.length ? `- Current Medications: ${patientInfo.medications.join(", ")}` : ""}
${patientInfo.pregnancyStatus ? `- Pregnancy Status: ${patientInfo.pregnancyStatus}` : ""}`;
  }

  // Format previous consultations if available
  let previousConsultationsSection = "";
  if (request.previousConsultations?.length) {
    previousConsultationsSection = `PREVIOUS CONSULTATIONS:
${request.previousConsultations.map(consult => 
  `- Date: ${consult.date}
  - Symptoms: ${consult.symptoms}
  ${consult.diagnosis ? `- Diagnosis: ${consult.diagnosis}` : ""}
  ${consult.treatment ? `- Treatment: ${consult.treatment}` : ""}`
).join("\n")}`;
  }

  // Format previous triage results if available
  let previousTriageSection = "";
  if (request.previousTriageResults?.length) {
    previousTriageSection = `PREVIOUS ASSESSMENTS:
${request.previousTriageResults.map(triage => 
  `- Date: ${triage.date}
  - Symptoms: ${triage.symptoms}
  - Priority: ${triage.priority}
  ${triage.vitalSigns?.temperature ? `- Temperature: ${triage.vitalSigns.temperature}` : ""}
  ${triage.vitalSigns?.respiratoryRate ? `- Respiratory Rate: ${triage.vitalSigns.respiratoryRate}` : ""}`
).join("\n")}`;
  }

  // Format vital signs if available
  let vitalSignsSection = "";
  if (vitalSigns) {
    vitalSignsSection = `VITAL SIGNS:
${vitalSigns.temperature ? `- Temperature: ${vitalSigns.temperature}°C` : ""}
${vitalSigns.bloodPressure ? `- Blood Pressure: ${vitalSigns.bloodPressure} mmHg` : ""}
${vitalSigns.heartRate ? `- Heart Rate: ${vitalSigns.heartRate} bpm` : ""}
${vitalSigns.respiratoryRate ? `- Respiratory Rate: ${vitalSigns.respiratoryRate} breaths/min` : ""}
${vitalSigns.oxygenSaturation ? `- Oxygen Saturation: ${vitalSigns.oxygenSaturation}%` : ""}
${vitalSigns.weight ? `- Weight: ${vitalSigns.weight} kg` : ""}
${vitalSigns.bmi ? `- BMI: ${vitalSigns.bmi}` : ""}`;
  }

  // Geographic context based on village if available
  let geographicContext = "";
  if (patientInfo.village) {
    geographicContext = `
GEOGRAPHIC CONTEXT:
The patient is from ${patientInfo.village}, Kenya. Consider local disease prevalence and available healthcare resources.`;
  }

  let prompt = `
I need your help with a detailed medical consultation for a patient in rural Kenya. 
Please provide a thorough assessment and comprehensive recommendations.

PATIENT INFORMATION:
- Name: ${patientInfo.name || "Unknown"}
- Age: ${patientInfo.age || "Unknown"} years
- Gender: ${patientInfo.gender || "Unknown"}
${patientInfo.village ? `- Location: ${patientInfo.village}` : ""}
${patientInfo.weight ? `- Weight: ${patientInfo.weight} kg` : ""}
${patientInfo.height ? `- Height: ${patientInfo.height} cm` : ""}

${medicalHistorySection ? medicalHistorySection : ""}

CURRENT SYMPTOMS:
${symptoms}

${vitalSignsSection ? vitalSignsSection : ""}

${previousConsultationsSection ? previousConsultationsSection : ""}

${previousTriageSection ? previousTriageSection : ""}

${additionalNotes ? `ADDITIONAL NOTES:\n${additionalNotes}` : ""}

${geographicContext}

Please provide your response as a valid JSON object with the following structure:
{
  "assessment": "Detailed clinical assessment of what could be happening with this patient",
  "recommendedActions": ["Action 1", "Action 2", "Action 3", ...],
  "urgencyLevel": "low|medium|high",
  "followUpRecommendation": "When the CHW should follow up with this patient",
  "patientEducation": "What the patient should be told about their condition and self-care",
  "referralNeeded": true|false,
  "referralReason": "If referral is needed, explain why (only include if referralNeeded is true)",
  "differentialDiagnoses": ["Possible diagnosis 1", "Possible diagnosis 2", ...],
  "medicationRecommendations": [
    {
      "name": "Medication name",
      "dosage": "Dosage information",
      "frequency": "How often to take",
      "duration": "How long to take",
      "notes": "Any special instructions"
    }
  ],
  "warningsAndContraindications": ["Warning 1", "Warning 2", ...],
  "redFlags": ["Symptom 1 that requires immediate attention", "Symptom 2", ...],
  "homeRemedies": ["Home remedy 1", "Home remedy 2", ...],
  "preventionAdvice": "Advice to prevent recurrence or spread"
}

Your response MUST be valid JSON that can be parsed by JavaScript. Don't include any explanations, prefixes, or text outside the JSON object.
Ensure each field contains appropriate information and the urgencyLevel is exactly one of: "low", "medium", or "high".
Recommended medications should be commonly available in rural Kenyan health centers and appropriate for CHWs to administer or recommend.
`;

  return prompt;
};

/**
 * Parse the AI response to extract structured information
 */
const parseAIResponse = (aiResponse: string): ConsultationResponse => {
  try {
    // First, try to parse the response as JSON directly
    let jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const jsonResponse = JSON.parse(jsonMatch[0]);
        
        // Validate the response structure
        const validatedResponse: ConsultationResponse = {
          assessment: jsonResponse.assessment || "No assessment provided",
          recommendedActions: Array.isArray(jsonResponse.recommendedActions) ? 
                            jsonResponse.recommendedActions : 
                            ["No specific actions provided"],
          urgencyLevel: ["low", "medium", "high"].includes(jsonResponse.urgencyLevel) ? 
                      jsonResponse.urgencyLevel as "low" | "medium" | "high" : 
                      "medium",
          followUpRecommendation: jsonResponse.followUpRecommendation || "No follow-up recommendation provided",
          patientEducation: jsonResponse.patientEducation || "No patient education provided",
          referralNeeded: Boolean(jsonResponse.referralNeeded),
          referralReason: jsonResponse.referralNeeded ? 
                        (jsonResponse.referralReason || "No specific reason provided") : 
                        undefined,
          
          // Handle new optional fields
          differentialDiagnoses: Array.isArray(jsonResponse.differentialDiagnoses) ? 
                               jsonResponse.differentialDiagnoses : 
                               undefined,
          
          medicationRecommendations: Array.isArray(jsonResponse.medicationRecommendations) ?
                                   jsonResponse.medicationRecommendations.map(med => ({
                                     name: med.name || "Unknown medication",
                                     dosage: med.dosage || "Consult healthcare provider for dosage",
                                     frequency: med.frequency || "As directed",
                                     duration: med.duration || "As needed",
                                     notes: med.notes
                                   })) :
                                   undefined,
          
          warningsAndContraindications: Array.isArray(jsonResponse.warningsAndContraindications) ?
                                      jsonResponse.warningsAndContraindications :
                                      undefined,
          
          redFlags: Array.isArray(jsonResponse.redFlags) ?
                  jsonResponse.redFlags :
                  undefined,
          
          homeRemedies: Array.isArray(jsonResponse.homeRemedies) ?
                      jsonResponse.homeRemedies :
                      undefined,
          
          preventionAdvice: jsonResponse.preventionAdvice || undefined
        };
        
        return validatedResponse;
      } catch (jsonError) {
        console.error("Error parsing JSON from AI response:", jsonError);
        // If JSON parsing fails, fall back to regex parsing
      }
    }
    
    // Fall back to the existing regex-based parsing if JSON parsing fails
    // Default response structure
    const result: ConsultationResponse = {
      assessment: "",
      recommendedActions: [],
      urgencyLevel: "medium",
      followUpRecommendation: "",
      patientEducation: "",
      referralNeeded: false,
      referralReason: ""
    };

    // Extract assessment
    const assessmentMatch = aiResponse.match(/Assessment:([^\n]*(?:\n(?!Recommended actions)[^\n]*)*)/i);
    if (assessmentMatch && assessmentMatch[1]) {
      result.assessment = assessmentMatch[1].trim();
    }

    // Extract recommended actions
    const actionsMatch = aiResponse.match(/Recommended actions:([^\n]*(?:\n(?!Urgency level)[^\n]*)*)/i);
    if (actionsMatch && actionsMatch[1]) {
      const actionsText = actionsMatch[1].trim();
      // Look for numbered items (1. Action item)
      const actionItems = actionsText.match(/\d+\.\s+[^\n]+/g);
      if (actionItems) {
        result.recommendedActions = actionItems.map(item => item.replace(/^\d+\.\s+/, '').trim());
      } else {
        // If no numbered items, split by newlines
        result.recommendedActions = actionsText.split('\n').map(line => line.trim()).filter(Boolean);
      }
    }

    // Extract urgency level
    const urgencyMatch = aiResponse.match(/Urgency level:([^\n]*)/i);
    if (urgencyMatch && urgencyMatch[1]) {
      const urgencyText = urgencyMatch[1].trim().toLowerCase();
      if (urgencyText.includes('high')) {
        result.urgencyLevel = "high";
      } else if (urgencyText.includes('medium') || urgencyText.includes('moderate')) {
        result.urgencyLevel = "medium";
      } else if (urgencyText.includes('low')) {
        result.urgencyLevel = "low";
      }
    }

    // Extract follow-up recommendation
    const followUpMatch = aiResponse.match(/Follow-up:([^\n]*(?:\n(?!Patient education)[^\n]*)*)/i);
    if (followUpMatch && followUpMatch[1]) {
      result.followUpRecommendation = followUpMatch[1].trim();
    }

    // Extract patient education
    const educationMatch = aiResponse.match(/Patient education:([^\n]*(?:\n(?!Referral needed)[^\n]*)*)/i);
    if (educationMatch && educationMatch[1]) {
      result.patientEducation = educationMatch[1].trim();
    }

    // Extract referral needed
    const referralMatch = aiResponse.match(/Referral needed:([^\n]*)/i);
    if (referralMatch && referralMatch[1]) {
      const referralText = referralMatch[1].trim().toLowerCase();
      result.referralNeeded = referralText.includes('yes') || referralText.includes('true');
    }

    // Extract referral reason
    if (result.referralNeeded) {
      const reasonMatch = aiResponse.match(/If referral is needed, why:([^\n]*(?:\n(?!$)[^\n]*)*)/i) || 
                          aiResponse.match(/referral reason:([^\n]*(?:\n(?!$)[^\n]*)*)/i);
      if (reasonMatch && reasonMatch[1]) {
        result.referralReason = reasonMatch[1].trim();
      }
    }

    return result;
  } catch (error) {
    console.error("Error parsing AI response:", error);
    // Return a basic fallback
    return {
      assessment: "Error parsing response. Please review the full AI response.",
      recommendedActions: ["Consult with a healthcare professional"],
      urgencyLevel: "medium",
      followUpRecommendation: "As soon as possible",
      patientEducation: "Please monitor symptoms and seek medical attention if they worsen",
      referralNeeded: true,
      referralReason: "Unable to provide proper assessment"
    };
  }
};

// Function to save consultation to localStorage
export const saveConsultation = (
  consultation: {
    id: string;
    patientId: string;
    patientName: string;
    symptoms: string;
    status: string;
    priority: string;
    createdAt: string;
    lastMessage: string;
    response?: ConsultationResponse;
  }
) => {
  try {
    // Get existing consultations
    const existingConsultations = localStorage.getItem("kenya-chw-consultations");
    let consultations = existingConsultations ? JSON.parse(existingConsultations) : [];
    
    // Add new consultation
    consultations.unshift(consultation);
    
    // Save to localStorage
    localStorage.setItem("kenya-chw-consultations", JSON.stringify(consultations));
    
    return true;
  } catch (error) {
    console.error("Error saving consultation:", error);
    return false;
  }
};

// Function to get consultations from localStorage
export const getConsultations = () => {
  try {
    const consultations = localStorage.getItem("kenya-chw-consultations");
    return consultations ? JSON.parse(consultations) : [];
  } catch (error) {
    console.error("Error getting consultations:", error);
    return [];
  }
};

/**
 * Test the connection to the Groq API
 */
export const testGroqConnection = async (): Promise<{ connected: boolean; message: string }> => {
  try {
    // Simple test request to Groq API
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant."
          },
          {
            role: "user",
            content: "Please respond with 'Connection successful' if you receive this message."
          }
        ],
        temperature: 0.3,
        max_tokens: 20
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { 
        connected: false, 
        message: `API error: ${response.status} ${errorText}` 
      };
    }

    const data = await response.json();
    return { 
      connected: true, 
      message: "Successfully connected to Groq API" 
    };
  } catch (error) {
    console.error("Error testing Groq connection:", error);
    return { 
      connected: false, 
      message: `Connection error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}; 