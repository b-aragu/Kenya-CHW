import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MobileLayout from "@/components/layout/MobileLayout";
import AppNavigation from "@/components/AppNavigation";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Calendar, 
  Activity, 
  AlertTriangle, 
  ArrowUpRight, 
  CheckCircle2, 
  Users2,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAppContext } from "@/context/AppContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { syncOfflineChanges } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [userData, setUserData] = useState({
    patients: [],
    consultations: [],
    activities: [],
    appointments: []
  });
  
  // Calculate consultation stats from userData
  const calculateConsultationStats = () => {
    const consultations = userData.consultations || [];
    
    // Only include consultations from the current month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const thisMonthConsultations = consultations.filter((consult: any) => {
      const consultDate = new Date(consult.createdAt);
      return consultDate.getMonth() === currentMonth && consultDate.getFullYear() === currentYear;
    });
    
    // Calculate stats
    const totalConsultations = consultations.length;
    const activeConsultations = consultations.filter((c: any) => c.status === "active").length;
    const pendingConsultations = consultations.filter((c: any) => c.status === "pending").length;
    const completedConsultations = consultations.filter((c: any) => c.status === "completed").length;
    
    const highPriority = consultations.filter((c: any) => c.priority === "high").length;
    const mediumPriority = consultations.filter((c: any) => c.priority === "medium").length;
    const lowPriority = consultations.filter((c: any) => c.priority === "low").length;
    
    const thisMonthTotal = thisMonthConsultations.length;
    
    // Get patients with consultations
    const uniquePatientIds = new Set(consultations.map((c: any) => c.patientId));
    const patientsWithConsults = uniquePatientIds.size;
    
    // Calculate referral rate
    const consultationsWithReferrals = consultations.filter((c: any) => 
      c.response && c.response.referralNeeded
    ).length;
    
    const referralRate = totalConsultations > 0 
      ? Math.round((consultationsWithReferrals / totalConsultations) * 100) 
      : 0;
    
    return {
      totalConsultations,
      activeConsultations,
      pendingConsultations,
      completedConsultations,
      highPriority,
      mediumPriority,
      lowPriority,
      thisMonthTotal,
      patientsWithConsults,
      referralRate
    };
  };

  // Calculate patient stats
  const calculatePatientStats = () => {
    const patients = userData.patients || [];
    return {
      totalPatients: patients.length,
      followUpCount: patients.filter((p: any) => p.followUp).length
    };
  };

  // Load data from localStorage
  const loadDashboardData = () => {
    try {
      const storedData = localStorage.getItem("userData");
      if (storedData) {
        const data = JSON.parse(storedData);
        setUserData(data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Data Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle sync
  const handleSync = async () => {
    setLoading(true);
    try {
      const result = await syncOfflineChanges();
      if (result.success) {
        loadDashboardData();
        toast({
          title: "Sync Successful",
          description: "Dashboard data has been updated",
        });
      } else {
        toast({
          title: "Sync Failed",
          description: result.error || "Could not sync data",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Sync Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    // Handle online/offline status
    const handleOnline = () => {
      setOfflineMode(false);
      syncOfflineChanges().then(result => {
        if (result.success) {
          loadDashboardData();
          toast({
            title: "Sync Complete",
            description: "Dashboard data has been updated",
          });
        }
      });
    };

    const handleOffline = () => setOfflineMode(true);

    // Set up online/offline listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial data load
    loadDashboardData();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [navigate, toast]);

  const patientStats = calculatePatientStats();
  const consultStats = calculateConsultationStats();
  
  // Get recent activities
  const recentActivities = (userData.activities || [])
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light pb-16">
      <MobileLayout title="Dashboard">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse-light">Loading dashboard data...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sync and Offline Header */}
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-semibold">Community Health Dashboard</h1>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleSync}
                disabled={offlineMode || loading}
                className={offlineMode ? "opacity-50 cursor-not-allowed" : ""}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
            
            {offlineMode && (
              <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md text-sm">
                Offline Mode - Showing locally stored data. Some information may be outdated.
              </div>
            )}
            
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto text-primary opacity-80" />
                    <h3 className="mt-2 font-semibold text-neutral-600">Patients</h3>
                    <p className="text-3xl font-bold text-primary mt-2">{patientStats.totalPatients}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Calendar className="h-8 w-8 mx-auto text-primary opacity-80" />
                    <h3 className="mt-2 font-semibold text-neutral-600">Appointments</h3>
                    <p className="text-3xl font-bold text-primary mt-2">{userData.appointments?.length || 0}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Activity className="h-8 w-8 mx-auto text-primary opacity-80" />
                    <h3 className="mt-2 font-semibold text-neutral-600">Follow-ups</h3>
                    <p className="text-3xl font-bold text-primary mt-2">{patientStats.followUpCount}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Consultation Analytics Section */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Consultation Analytics</h2>
                <Button 
                  variant="link" 
                  className="text-primary p-0 h-auto"
                  onClick={() => navigate("/consultations")}
                >
                  View All
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Consultations */}
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Users2 className="h-8 w-8 mx-auto text-primary opacity-80" />
                      <h3 className="mt-2 font-semibold text-neutral-600">Total Consultations</h3>
                      <p className="text-3xl font-bold text-primary mt-2">{consultStats.totalConsultations}</p>
                      <p className="text-sm text-neutral-500 mt-1">This month: {consultStats.thisMonthTotal}</p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Priority Breakdown */}
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 opacity-80" />
                      <h3 className="mt-2 font-semibold text-neutral-600">By Priority</h3>
                      <div className="flex justify-center items-center gap-4 mt-4">
                        <div className="text-center">
                          <Badge variant="destructive" className="mb-1">High</Badge>
                          <p className="text-xl font-semibold">{consultStats.highPriority}</p>
                        </div>
                        <div className="text-center">
                          <Badge className="bg-yellow-500 mb-1">Medium</Badge>
                          <p className="text-xl font-semibold">{consultStats.mediumPriority}</p>
                        </div>
                        <div className="text-center">
                          <Badge className="bg-green-500 mb-1">Low</Badge>
                          <p className="text-xl font-semibold">{consultStats.lowPriority}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Status Breakdown */}
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle2 className="h-8 w-8 mx-auto text-primary opacity-80" />
                      <h3 className="mt-2 font-semibold text-neutral-600">By Status</h3>
                      <div className="grid grid-cols-3 gap-1 mt-4">
                        <div className="text-center">
                          <p className="text-xs">Active</p>
                          <p className="text-lg font-semibold">{consultStats.activeConsultations}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs">Pending</p>
                          <p className="text-lg font-semibold">{consultStats.pendingConsultations}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs">Completed</p>
                          <p className="text-lg font-semibold">{consultStats.completedConsultations}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Referral Rate */}
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <ArrowUpRight className="h-8 w-8 mx-auto text-primary opacity-80" />
                      <h3 className="mt-2 font-semibold text-neutral-600">Referral Rate</h3>
                      <div className="mt-4">
                        <p className="text-3xl font-bold text-primary">{consultStats.referralRate}%</p>
                        <p className="text-sm text-neutral-500 mt-1">Of all consultations</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Recent Activities */}
            {recentActivities.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold">Recent Activities</h2>
                  <Button 
                    variant="link" 
                    className="text-primary p-0 h-auto"
                    onClick={() => navigate("/activities")}
                  >
                    View All
                  </Button>
                </div>
                <div className="space-y-3">
                  {recentActivities.map((activity: any, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between">
                          <p className="text-sm">{activity.message}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </MobileLayout>
      <AppNavigation />
    </div>
  );
};

export default Dashboard;