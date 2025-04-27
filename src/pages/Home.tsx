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
import { getRecentActivity, markActivityAsRead, Activity } from "@/services/mockData";

const AUTO_REFRESH_INTERVAL = 60000; // 60 seconds

const Home = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("CHW");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const statsRef = useRef<{ refresh: () => void } | null>(null);
  const appointmentsRef = useRef<{ refresh: () => void } | null>(null);
  const refreshTimerRef = useRef<number | null>(null);

  // Check if there are unread notifications
  const hasUnreadNotifications = recentActivity.some(activity => !activity.read);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    // Check if user is authenticated
    const auth = localStorage.getItem("kenya-chw-auth");
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
          const activity = getRecentActivity();
          setRecentActivity(activity);
          
          // Refresh stats and appointments
          if (statsRef.current) {
            statsRef.current.refresh();
          }
          
          if (appointmentsRef.current) {
            appointmentsRef.current.refresh();
          }
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
      // Refresh all dashboard components
      await loadDashboardData();
      
      // Refresh stats using the ref
      if (statsRef.current) {
        statsRef.current.refresh();
      }
      
      // Refresh appointments using the ref
      if (appointmentsRef.current) {
        appointmentsRef.current.refresh();
      }
      
      // Also dispatch a custom event for any component listening
      window.dispatchEvent(new CustomEvent('dashboard-refresh'));
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
      markActivityAsRead(activity.id);
      // Update the local state to reflect the change
      setRecentActivity(prev => 
        prev.map(a => a.id === activity.id ? { ...a, read: true } : a)
      );
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
                        <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
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
