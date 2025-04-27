
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import AddPatientForm from "@/components/patients/AddPatientForm";
import { Patient } from "@/types/patient";

const AddPatient = () => {
  const navigate = useNavigate();

  const handleSavePatient = (patientData: Patient) => {
    // Get existing patients from localStorage
    const existingPatients = localStorage.getItem("kenya-chw-patients");
    let patients = existingPatients ? JSON.parse(existingPatients) : [];
    
    // Add new patient to the list
    patients = [patientData, ...patients];
    
    // Save back to localStorage
    localStorage.setItem("kenya-chw-patients", JSON.stringify(patients));
    
    // Navigate to all patients or the new patient's details
    navigate("/patients");
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <MobileLayout 
      title="Add New Patient" 
      showBack={true} 
      onBack={handleCancel}
    >
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
        <AddPatientForm 
          onSave={handleSavePatient}
          onCancel={handleCancel}
        />
      </div>
    </MobileLayout>
  );
};

export default AddPatient;
