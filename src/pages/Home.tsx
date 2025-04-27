
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import AppNavigation from "@/components/AppNavigation";
import DashboardStats from "@/components/dashboard/DashboardStats";
import SearchBar from "@/components/dashboard/SearchBar";
import AppointmentsCard from "@/components/dashboard/AppointmentsCard";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Users, Bell } from "lucide-react";
import { getRecentActivity, Activity } from "@/services/mockData";

const Home = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("CHW");
  const [isLoading, setIsLoading] = useState(true);
  const [hasNotifications, setHasNotifications] = useState(true);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

  useEffect(() => {
    // Check if user is authenticated
    const auth = localStorage.getItem("kenya-chw-auth");
    if (!auth) {
      navigate("/");
      return;
    }

    // Simulate loading user data and activity
    const loadData = async () => {
      setIsLoading(true);
      try {
        // This would be a real API call in production
        setUserName("David Mwangi");
        const activity = getRecentActivity();
        setRecentActivity(activity);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light pb-16">
      <MobileLayout title="Kenya-CHW Dashboard">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse-light">Loading dashboard...</div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-4">
              <h2 className="text-xl font-semibold">
                {getGreeting()}, {userName}
              </h2>
              <p className="text-gray-600 text-sm">Welcome to your dashboard</p>
            </div>

            <SearchBar />
            
            <DashboardStats />
            
            <AppointmentsCard />

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Recent Activity</h3>
                  {hasNotifications && (
                    <div className="relative">
                      <Bell className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  {recentActivity.map((activity) => (
                    <div 
                      key={activity.id}
                      className={`p-2 rounded-md ${
                        activity.type === 'urgent' ? 'bg-destructive/10' : 
                        activity.type === 'new_patient' ? 'bg-secondary/10' :
                        'bg-accent/10'
                      }`}
                    >
                      <p className="text-gray-600">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4">
              <Button 
                onClick={() => navigate('/patients/add')}
                className="bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 h-14 w-full"
              >
                <UserPlus className="h-5 w-5" />
                Register New Patient
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/patients')}
                className="flex items-center justify-center gap-2 h-14 w-full border-2"
              >
                <Users className="h-5 w-5" />
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
