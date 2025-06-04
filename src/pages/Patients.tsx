
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MobileLayout from "@/components/layout/MobileLayout";
import AppNavigation from "@/components/AppNavigation";
import PatientList from "@/components/patients/PatientList";
import { Patient } from "@/types/patient";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/AppContext";
import { create } from "domain";
import { set } from "date-fns";

const Patients = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
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

    // Load patients from localStorage
    const loadPatients = () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const storedPatients = userData.patients || {};

        // Transform stored patients to match patient type
        const formattedPatients: Patient[] = storedPatients.map((p: any) => ({
          id: p.id,
          name: p.name,
          dateOfBirth: p.dateOfBirth || p.dob || 'Uknown',
          gender: p.gender,
          village: p.location || p.village || 'Uknown',
          phonNumber: p.phone || "uknown",
          createdAt: p.createdAt || new Date().toISOString(),
          followUp: p.followUp || false,
          cwhId: p.chwID || '',
          _syncStatus: p._syncStatus || 'synced'
        }));

        setPatients(formattedPatients);
      } catch (err) {
        console.error('Error Loading patients: ', err);
        toast({ title: 'Data Error', description: 'Failed to load patient data', variant: 'destructive' });
        setPatients([]);
      } finally { setIsLoading(false); }
    };

    // Handle online and offline
    const handleOnline = () => {
      setOfflineMode(false);
      syncOfflineChanges().then(result => {
        if (result.success) {
          loadPatients();
          toast({ title: 'Sync Comlete', description: 'Patient data has been updated' });
        }
      });
    };

    const handleOffLine = () => setOfflineMode(true);

    // initial load
    loadPatients();

    // set online and offline listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffLine);
    };
  }, [navigate, toast]);

  const handlePatientSelect = (id: string) => {
    navigate(`/patients/${id}`);
  };

  const handleSyncPatients = async () => {
    try {
      setIsLoading(true);
      const result = await syncOfflineChanges();
      if (result.success) {
        // reload
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        setPatients(userData.patients || []);
        toast({ title: 'Sync Successful', description: 'Patients data has been synchronized' });
      } else { toast({ title: 'Sync Failed', description: result.error || 'Could not sync patient data', variant: 'destructive' }); }
    } catch (err) { toast({ title: 'Sync Error', description: 'An unexpected error occured', variant: 'destructive' }); }
    finally { setIsLoading(false) }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light pb-16">
      <MobileLayout title="Patients">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse-light">Loading patients...</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Button 
                onClick={() => navigate('/patients/add')}
                className="bg-primary hover:bg-primary/80"
              >
                <svg className="mr-2" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" x2="12" y1="5" y2="19"></line>
                  <line x1="5" x2="19" y1="12" y2="12"></line>
                </svg>
                Add Patient
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleSyncPatients}
                disabled={offlineMode}
                className={offlineMode ? "opacity-50 cursor-not-allowed" : ""}
              >
                <svg className="mr-2" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 16h5v5" />
                </svg>
                Sync
              </Button>
            </div>
            
            {offlineMode && (
              <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md text-sm">
                Offline Mode - Showing locally stored patients. Some data may be outdated.
              </div>
            )}
            
            {patients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-600 mb-4">No patients found</p>
                <Button 
                  onClick={() => navigate('/patients/add')}
                  className="bg-primary hover:bg-primary/80"
                >
                  Register First Patient
                </Button>
              </div>
            ) : (
              <PatientList 
                patients={patients} 
                onPatientSelect={handlePatientSelect} 
              />
            )}
          </div>
        )}
      </MobileLayout>
      <AppNavigation />
    </div>
  );
};

export default Patients;
