
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Patient } from "@/types/patient";

interface PatientCardProps {
  patient: Patient;
  onClick: (id: string) => void;
}

const PatientCard = ({ patient, onClick }: PatientCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  };
  
  // Calculate age from date of birth
  const getAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow" onClick={() => onClick(patient.id)}>
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mr-4 text-lg font-bold">
            {getInitials(patient.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {patient.name}
            </h3>
            <div className="flex flex-wrap text-sm text-gray-500 space-x-3">
              <span>{getAge(patient.dateOfBirth)} years</span>
              <span>•</span>
              <span>{patient.gender}</span>
              {patient.village && (
                <>
                  <span>•</span>
                  <span>{patient.village}</span>
                </>
              )}
            </div>
          </div>
          <div className="ml-2">
            {patient.followUp && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive text-white">
                Follow-up
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientCard;
