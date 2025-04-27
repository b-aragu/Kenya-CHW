
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Patient } from "@/types/patient";

interface TriageFormProps {
  patient: Patient;
  onComplete: (result: any) => void;
  onCancel: () => void;
}

const TriageForm = ({ patient, onComplete, onCancel }: TriageFormProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    symptoms: "",
    temperature: "",
    respiratoryRate: "",
    priority: "green", // Default priority: green (low), yellow (medium), red (high)
  });

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    
    setIsLoading(true);
    
    // Here, we would normally send the data to an API and get a triage result
    // For the MVP, we'll simulate an AI-based triage decision
    const simulateAITriage = () => {
      // Simple logic to determine priority based on symptoms and vitals
      const symptomsLower = formData.symptoms.toLowerCase();
      const temp = parseFloat(formData.temperature);
      const respRate = parseInt(formData.respiratoryRate);
      
      // High priority if high fever or respiratory distress mentioned
      if (
        (temp && temp >= 39) || 
        (respRate && respRate >= 30) ||
        symptomsLower.includes("difficulty breathing") ||
        symptomsLower.includes("unconscious") ||
        symptomsLower.includes("severe pain")
      ) {
        return "red";
      }
      
      // Medium priority for moderate issues
      else if (
        (temp && temp >= 38) ||
        (respRate && respRate >= 20) ||
        symptomsLower.includes("fever") ||
        symptomsLower.includes("cough") ||
        symptomsLower.includes("diarrhea")
      ) {
        return "yellow";
      }
      
      // Low priority for everything else
      return "green";
    };
    
    // Simulate API delay
    setTimeout(() => {
      const priority = simulateAITriage();
      
      const triageResult = {
        ...formData,
        priority,
        patientId: patient.id,
        timestamp: new Date().toISOString(),
      };
      
      setIsLoading(false);
      onComplete(triageResult);
      
      // Show toast with priority color
      const priorityText = priority === "red" ? "High" : priority === "yellow" ? "Medium" : "Low";
      
      toast({
        title: `Triage Complete: ${priorityText} Priority`,
        description: `Patient ${patient.name} has been triaged.`,
        variant: priority === "red" ? "destructive" : undefined,
      });
    }, 1500);
  };

  // Render different form steps
  const renderFormContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <CardHeader>
              <CardTitle>Step 1: Patient Symptoms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700">
                  Describe the patient's symptoms
                </label>
                <Textarea
                  id="symptoms"
                  value={formData.symptoms}
                  onChange={(e) => handleChange("symptoms", e.target.value)}
                  placeholder="Enter patient's symptoms"
                  className="min-h-[150px]"
                  required
                />
              </div>
            </CardContent>
          </>
        );
        
      case 2:
        return (
          <>
            <CardHeader>
              <CardTitle>Step 2: Vital Signs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                  Temperature (°C)
                </label>
                <input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => handleChange("temperature", e.target.value)}
                  placeholder="e.g., 37.5"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="respiratoryRate" className="block text-sm font-medium text-gray-700">
                  Respiratory Rate (breaths/min)
                </label>
                <input
                  id="respiratoryRate"
                  type="number"
                  value={formData.respiratoryRate}
                  onChange={(e) => handleChange("respiratoryRate", e.target.value)}
                  placeholder="e.g., 18"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </CardContent>
          </>
        );
        
      case 3:
        return (
          <>
            <CardHeader>
              <CardTitle>Step 3: Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  Manual Priority Override (optional)
                </label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => handleChange("priority", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="green">Low Priority</SelectItem>
                    <SelectItem value="yellow">Medium Priority</SelectItem>
                    <SelectItem value="red">High Priority</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  The AI will suggest a priority, but you can override it if needed.
                </p>
              </div>
            </CardContent>
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      {renderFormContent()}
      
      <CardFooter className="flex justify-between">
        {step > 1 ? (
          <Button 
            type="button" 
            variant="outline"
            onClick={() => setStep(step - 1)}
          >
            Back
          </Button>
        ) : (
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        
        <Button 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {step < 3 ? "Next" : isLoading ? "Processing..." : "Complete Triage"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TriageForm;
