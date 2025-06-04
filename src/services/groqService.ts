import { Patient } from "@/types/patient";
import axios from 'axios';
import { useAppContext } from "@/context/AppContext";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama3-70b-8192";

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

/**
 * Generate a consultation response using Groq's LLM API
 */
export const generateConsultation = async (request: ConsultationRequest): Promise<ConsultationResponse> => {
  try {
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

/**
 * Test the connection to the Groq API
 */
export const testGroqConnection = async () => {
  if (!GROQ_API_KEY) {
    return { connected: false, message: 'API key not configured'};
  }
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: "Test connection" }],
        max_tokens: 5,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 5000, // Add timeout
      }
    );

    return {
      connected: true,
      message: "Connection successful",
    };
  } catch (error: any) {
    console.error("Groq connection error:", error.response?.data || error.message);
    return {
      connected: false,
      message: error.response?.data?.error?.message || error.message,
    };
  }
};