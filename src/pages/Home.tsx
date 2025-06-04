import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import AppNavigation from "@/components/AppNavigation";
import DashboardStats from "@/components/dashboard/DashboardStats";
import SearchBar from "@/components/dashboard/SearchBar";
import AppointmentsCard from "@/components/dashboard/AppointmentsCard";
import StatsSummary from "@/components/dashboard/StatsSummary";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Users, Bell, RefreshCw } from "lucide-react";
import { Activity } from "@/services/mockData";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { StepId } from "framer-motion";
import { dataTagSymbol } from "@tanstack/react-query";

const AUTO_REFRESH_INTERVAL = 60000; // 60 seconds

interface UserData{
  patients: any[];
  consultations: any[];
  activities: Activity[];
  user?: {
    id: string;
    name: string;
    phone: string;
    role: string;
  };
  lastSync?: string;
}

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userName, setUserName] = useState("CHW");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const statsRef = useRef<{ refresh: () => void } | null>(null);
  const appointmentsRef = useRef<{ refresh: () => void } | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const { syncOfflineChanges } = useAppContext();

  // get user data from local storage
  const getUserData = (): UserData | null =>{
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data): null;
  };

  // Check if there are unread notifications
  const hasUnreadNotifications = recentActivity.some(activity => !activity.read);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = getUserData();
      if (!data){
        toast({title: 'Data error', description: 'Couldnot load user data', variant: 'destructive',});
        return;
      }

      setUserData(data);
      setUserName(data.user?.name || 'chw');

      // get 10 recent activities
      const activities = data.activities || [];
      const sortedActivities = [...activities].sort( (a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime() ).slice(0,10);
      setRecentActivity(sortedActivities);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({title: 'Data Error', description: 'Failed to load dashboard data', variant: 'destructive'});
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Handle sync when coming online
  useEffect(() => {
    const handleOnline = () => {
      syncOfflineChanges().then(result => {
        if (result.success){
          toast({title: 'Sync Completed', description: 'Offline changes have been synchronized.'});
          loadDashboardData();
        }
      });
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [loadDashboardData, toast]);

  useEffect(() => {
    // Check if user is authenticated
    const auth = localStorage.getItem("token");
    if (!auth) {
      navigate("/");
      return;
    }

    loadDashboardData();

    // Setup automatic refresh
    refreshTimerRef.current = window.setInterval(() => {
      // Silent refresh (no loading indicators)
      const refreshDashboard = async () => {
        try {
          const data = getUserData();
          if (!data) return;

          // Update recent activities
          const activities = data.activities || [];
          const sortedActivities = [...activities].sort( (a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime() ).slice(0,10);
          setRecentActivity(sortedActivities);
          
          // Refresh stats and appointments
          if (statsRef.current) statsRef.current.refresh();
          if (appointmentsRef.current) appointmentsRef.current.refresh();

        } catch (error) {
          console.error("Error during auto-refresh:", error);
        }
      };
      
      refreshDashboard();
    }, AUTO_REFRESH_INTERVAL);

    // Cleanup interval on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [navigate, loadDashboardData]);

  // Refresh dashboard data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Try to sync offline changes first
      const syncResult = await syncOfflineChanges();
      if (syncResult.success) toast({title: 'Sync Complete', description: 'Offline changes have been synchronized',});

      // Refresh all dashboard components
      await loadDashboardData();
      
      // Refresh stats and appointments using the ref
      if (statsRef.current) statsRef.current.refresh();
      if (appointmentsRef.current) appointmentsRef.current.refresh();
      
      // Also dispatch a custom event for any component listening
      window.dispatchEvent(new CustomEvent('dashboard-refresh'));
    } catch (error) {
      console.error('Refresh Error: ', error);
      toast({title: 'Refresh Failed', description: 'Could not refresh dashboard data', variant: 'destructive',});
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500); // Show refresh animation for at least 500ms
    }
  };

  // Handle activity click
  const handleActivityClick = (activity: Activity) => {
    // Mark activity as read
    if (!activity.read) {
      const data = getUserData();
      if (data){
        const updatedActivities = data.activities.map( a => a.id === activity.id ? { ...a, read: true } : a );
        const updatedData = { ...data, activities: updatedActivities, user: data.user };
        localStorage.setItem('userData', JSON.stringify(updatedData));

        // update UI state
        setRecentActivity(prev => prev.map( a => a.id === activity.id ? { ...a, read: true } : a ));
      }
    }
    
    // Navigate to related patient if applicable
    if (activity.patientId) {
      navigate(`/patients/${activity.patientId}`);
    }
  };

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
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    {getGreeting()}, {userName}
                  </h2>
                  <p className="text-gray-600 text-sm">Welcome to your dashboard</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`h-8 w-8 ${isRefreshing ? 'animate-spin' : ''}`}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <StatsSummary />

            <SearchBar />
            
            <DashboardStats ref={statsRef} />
            
            <AppointmentsCard ref={appointmentsRef} />

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Recent Activity</h3>
                  {hasUnreadNotifications && (
                    <div className="relative">
                      <Bell className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div 
                        key={activity.id}
                        onClick={() => handleActivityClick(activity)}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          activity.type === 'urgent' ? 'bg-destructive/10 hover:bg-destructive/20' : 
                          activity.type === 'new_patient' ? 'bg-secondary/10 hover:bg-secondary/20' :
                          'bg-accent/10 hover:bg-accent/20'
                        } ${!activity.read ? 'border-l-4 border-primary' : ''}`}
                      >
                        <p className={`${!activity.read ? 'font-medium' : 'text-gray-600'}`}>
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(activity.lastUpdated).toISOString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-2">No recent activity</p>
                  )}
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
