import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import AddPatientForm from "@/components/patients/AddPatientForm";
import { Patient } from "@/types/patient";
import { useToast } from "@/components/ui/use-toast";
import { useAppContext } from "@/context/AppContext";
import { safeParseJSON } from "@/lib/storage";

const AddPatient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToSyncQueue, state, setState } = useAppContext();

  const handleSavePatient = (patientData: Patient) => {
    try {
      // 1) Try to use state.userData; if null, fall back to localStorage.
      let userData = state.userData;
      if (!userData) {
        const raw = localStorage.getItem("userData");
        // NOTE: safeParseJSON requires two arguments; provide an empty‐object fallback.
        userData = safeParseJSON(raw, {
          patients: [],
          consultations: [],
          activities: [],
          user: { id: "", name: "", phone: "", role: "" },
          lastSync: "",
        });
      }

      if (!userData || typeof userData !== "object") {
        throw new Error("No userData available");
      }

      // 2) Generate a temporary ID (PAT-…) whether online or offline:
      const isOnline = navigator.onLine;
      const patientId = isOnline
        ? `PAT-${Date.now()}`
        : `temp_${Date.now()}`;

      // 3) Use the `userData` variable to read the user’s ID, not state.userData!
      const newPatient = {
        ...patientData,
        id: patientId,
        lastUpdated: new Date().toISOString(),
        _syncStatus: isOnline ? "synced" : "pending",

        // ◀️ HERE is the fix: read from the local `userData.user`, not state.userData.user
        user_id: userData.user?.id || "",
      };

      // 4) Append this newPatient to whichever patients array we have:
      const existingPatients = Array.isArray(userData.patients)
        ? userData.patients
        : [];
      const updatedPatients = [...existingPatients, newPatient];

      // 5) Update the merged userData
      const updatedUserData = {
        ...userData,
        patients: updatedPatients,
      };

      setState((prev) => ({
        ...prev,
        userData: updatedUserData,
      }));

      // 6) Queue it for sync if offline, or queue anyway to sync even if online:
      addToSyncQueue({
        model: "Patient",
        type: "create",
        data: newPatient,
        tempId: patientId,
      });

      toast({
        title: isOnline ? "Patient Added" : "Patient Added Offline",
        description: isOnline
          ? "Patient has been successfully registered"
          : "Patient will be synced when you're back online",
      });

      // 7) Navigate to that patient’s detail page
      navigate(`/patients/${patientId}`);
    } catch (error) {
      console.error("Error saving patient:", error);
      toast({
        title: "Error",
        description: "Failed to save patient data",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <MobileLayout title="Add New Patient" showBack={true} onBack={handleCancel}>
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
        <AddPatientForm onSave={handleSavePatient} onCancel={handleCancel} />
      </div>
    </MobileLayout>
  );
};

export default AddPatient;
