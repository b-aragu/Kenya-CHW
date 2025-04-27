
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface AddPatientFormProps {
  onSave: (patientData: any) => void;
  onCancel: () => void;
}

const AddPatientForm = ({ onSave, onCancel }: AddPatientFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    gender: "",
    village: "",
    phoneNumber: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.gender || !formData.dateOfBirth) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Generate a unique ID (in a real app, this would come from the server)
    const newPatient = {
      ...formData,
      id: `CHW-${Date.now().toString().substr(-6)}`,
      createdAt: new Date().toISOString(),
      followUp: false,
    };
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Success",
        description: "Patient added successfully!",
      });
      onSave(newPatient);
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Patient Name *
        </label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Full name"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
          Date of Birth *
        </label>
        <Input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
          Gender *
        </label>
        <Select 
          value={formData.gender} 
          onValueChange={(value) => handleSelectChange("gender", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="village" className="block text-sm font-medium text-gray-700">
          Village/Area
        </label>
        <Input
          id="village"
          name="village"
          value={formData.village}
          onChange={handleChange}
          placeholder="Village or area name"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
          Phone Number
        </label>
        <Input
          id="phoneNumber"
          name="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="+254"
        />
      </div>
      
      <div className="flex justify-between space-x-4 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1 bg-primary hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Patient"}
        </Button>
      </div>
    </form>
  );
};

export default AddPatientForm;
