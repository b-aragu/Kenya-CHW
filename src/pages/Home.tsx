
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import AppNavigation from "@/components/AppNavigation";
import DashboardTile from "@/components/dashboard/DashboardTile";

const Home = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("CHW");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const auth = localStorage.getItem("kenya-chw-auth");
    if (!auth) {
      navigate("/");
      return;
    }

    // Simulate loading user data
    const timer = setTimeout(() => {
      setUserName("David Mwangi");
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [navigate]);

  // Get current time of day for greeting
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light pb-16">
      <MobileLayout title="Home Dashboard">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse-light">Loading dashboard...</div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-xl font-semibold">
                {getGreeting()}, {userName}
              </h2>
              <p className="text-gray-600 text-sm">Welcome to your dashboard</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DashboardTile
                title="Patients"
                value="24"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                }
              />
              <DashboardTile
                title="Follow-ups"
                value="3"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                    <path d="M16 2v4"></path>
                    <path d="M8 2v4"></path>
                    <path d="M3 10h18"></path>
                    <path d="m9 16 2 2 4-4"></path>
                  </svg>
                }
                color="bg-secondary"
              />
              <DashboardTile
                title="Urgent Cases"
                value="1"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" x2="12" y1="9" y2="13"></line>
                    <line x1="12" x2="12.01" y1="17" y2="17"></line>
                  </svg>
                }
                color="bg-destructive"
              />
              <DashboardTile
                title="Sync Status"
                value="Online"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 0 1-9 9c-4.97 0-9-4.03-9-9s4.03-9 9-9"></path>
                    <path d="M21 12c0-4.97-4.03-9-9-9"></path>
                    <path d="M15 12V9"></path>
                    <path d="M15 12h-3"></path>
                  </svg>
                }
                color="bg-green-600"
              />
            </div>

            <div className="flex flex-col space-y-4">
              <Button 
                onClick={() => navigate('/patients/add')}
                className="bg-primary hover:bg-primary/80 flex items-center justify-center gap-2 h-14"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" x2="19" y1="8" y2="14"></line>
                  <line x1="22" x2="16" y1="11" y2="11"></line>
                </svg>
                Register New Patient
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/patients')}
                className="flex items-center justify-center gap-2 h-14"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                View All Patients
              </Button>
            </div>
          </div>
        )}
      </MobileLayout>
      <AppNavigation />
    </div>
  );
};

export default Home;
