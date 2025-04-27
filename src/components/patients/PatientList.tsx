
import { useState } from "react";
import { Input } from "@/components/ui/input";
import PatientCard from "./PatientCard";
import { Patient } from "@/types/patient";

interface PatientListProps {
  patients: Patient[];
  onPatientSelect: (id: string) => void;
}

const PatientList = ({ patients, onPatientSelect }: PatientListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter patients based on search term
  const filteredPatients = patients.filter(
    patient => patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              patient.id.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-neutral-light pt-2 pb-4">
        <Input
          type="search"
          placeholder="Search patient name or ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>
      
      {filteredPatients.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No patients found</p>
        </div>
      ) : (
        <div>
          {filteredPatients.map(patient => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onClick={onPatientSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientList;
