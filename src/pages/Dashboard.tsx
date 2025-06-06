import { useState, useEffect } from "react";
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
  ChevronDown,
  ChevronUp,
  ClipboardList,
  MessageSquare,
  Clock,
  ArrowRight
} from "lucide-react";
import { getConsultations } from "@/services/groqService";
import { Button } from "@/components/ui/button";

// Add consultation analytics functions
const getConsultationStats = () => {
  const consultations = getConsultations();
  
  // Only include consultations from the current month
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const thisMonthConsultations = consultations.filter(consult => {
    const consultDate = new Date(consult.createdAt);
    return consultDate.getMonth() === currentMonth && consultDate.getFullYear() === currentYear;
  });
  
  // Calculate stats
  const totalConsultations = consultations.length;
  const activeConsultations = consultations.filter(c => c.status === "active").length;
  const pendingConsultations = consultations.filter(c => c.status === "pending").length;
  const completedConsultations = consultations.filter(c => c.status === "completed").length;
  
  const highPriority = consultations.filter(c => c.priority === "high").length;
  const mediumPriority = consultations.filter(c => c.priority === "medium").length;
  const lowPriority = consultations.filter(c => c.priority === "low").length;
  
  const thisMonthTotal = thisMonthConsultations.length;
  
  // Get patients with consultations
  const uniquePatientIds = new Set(consultations.map(c => c.patientId));
  const patientsWithConsults = uniquePatientIds.size;
  
  // Calculate referral rate
  const consultationsWithReferrals = consultations.filter(c => 
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

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patientsCount, setPatientsCount] = useState(0);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  
  // Add consultStats state
  const [consultStats, setConsultStats] = useState({
    totalConsultations: 0,
    activeConsultations: 0,
    pendingConsultations: 0,
    completedConsultations: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    thisMonthTotal: 0,
    patientsWithConsults: 0,
    referralRate: 0
  });

  useEffect(() => {
    // Check if user is authenticated
    const auth = localStorage.getItem("kenya-chw-auth");
    if (!auth) {
      navigate("/");
      return;
    }

    // Load dashboard data
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    
    // Calculate consultation statistics
    const stats = getConsultationStats();
    setConsultStats(stats);

    // Load existing patients data
    try {
      const storedPatients = localStorage.getItem("kenya-chw-patients");
      if (storedPatients) {
        const patients = JSON.parse(storedPatients);
        setPatientsCount(patients.length);
        
        // Calculate follow-ups needed
        const followUps = patients.filter(patient => patient.followUp).length;
        setFollowUpCount(followUps);
      }
      
      // Load appointments
      const storedAppointments = localStorage.getItem("kenya-chw-appointments");
      if (storedAppointments) {
        const appointments = JSON.parse(storedAppointments);
        setAppointmentsCount(appointments.length);
      }
      
      // Load recent activities
      const storedActivities = localStorage.getItem("kenya-chw-activity");
      if (storedActivities) {
        const activities = JSON.parse(storedActivities);
        setRecentActivities(activities.slice(0, 5)); // Get 5 most recent activities
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light pb-16">
      <MobileLayout title="Dashboard">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse-light">Loading dashboard data...</div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-md transition-all bg-white border-l-4 border-primary hover:scale-[1.02]"
                onClick={() => navigate('/patients')}
              >
                <CardContent className="pt-6 pb-6">
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="mt-2 font-semibold text-neutral-600">Patients</h3>
                    <p className="text-3xl font-bold text-primary mt-2">{patientsCount}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center justify-center">
                      <ArrowRight className="h-3 w-3 mr-1" /> View all patients
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:shadow-md transition-all bg-white border-l-4 border-blue-400 hover:scale-[1.02]"
                onClick={() => {
                  // Store appointment view preference
                  localStorage.setItem('appointment-view', 'all');
                  navigate('/patients');
                }}
              >
                <CardContent className="pt-6 pb-6">
                  <div className="text-center">
                    <Calendar className="h-8 w-8 mx-auto text-blue-500" />
                    <h3 className="mt-2 font-semibold text-neutral-600">Appointments</h3>
                    <p className="text-3xl font-bold text-blue-500 mt-2">{appointmentsCount}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center justify-center">
                      <ArrowRight className="h-3 w-3 mr-1" /> View all appointments
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:shadow-md transition-all bg-white border-l-4 border-amber-500 hover:scale-[1.02]"
                onClick={() => {
                  // Navigate to patients with follow-up filter
                  localStorage.setItem('patients-filter', 'follow-up');
                  navigate('/patients');
                }}
              >
                <CardContent className="pt-6 pb-6">
                  <div className="text-center">
                    <Activity className="h-8 w-8 mx-auto text-amber-500" />
                    <h3 className="mt-2 font-semibold text-neutral-600">Follow-ups</h3>
                    <p className="text-3xl font-bold text-amber-500 mt-2">{followUpCount}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center justify-center">
                      <ArrowRight className="h-3 w-3 mr-1" /> View patients needing follow-up
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:shadow-md transition-all bg-white border-l-4 border-red-500 hover:scale-[1.02]"
                onClick={() => {
                  // Navigate to high priority consultations
                  localStorage.setItem('consult-filter', 'high-priority');
                  navigate('/consult');
                }}
              >
                <CardContent className="pt-6 pb-6">
                  <div className="text-center">
                    <AlertTriangle className="h-8 w-8 mx-auto text-red-500" />
                    <h3 className="mt-2 font-semibold text-neutral-600">Urgent Cases</h3>
                    <p className="text-3xl font-bold text-red-500 mt-2">{consultStats.highPriority}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center justify-center">
                      <ArrowRight className="h-3 w-3 mr-1" /> View high priority consultations
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Consultation Analytics Section */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Consultation Analytics</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Consultations */}
                <Card 
                  className="bg-white cursor-pointer hover:shadow-md transition-all hover:border-primary hover:scale-[1.02]"
                  onClick={() => navigate('/consult')}
                >
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Users2 className="h-8 w-8 mx-auto text-primary" />
                      <h3 className="mt-2 font-semibold text-neutral-600">Total Consultations</h3>
                      <p className="text-3xl font-bold text-primary mt-2">{consultStats.totalConsultations}</p>
                      <p className="text-sm text-neutral-500 mt-1">This month: {consultStats.thisMonthTotal}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center justify-center">
                        <ArrowRight className="h-3 w-3 mr-1" /> View all consultations
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Priority Breakdown */}
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 opacity-80" />
                      <h3 className="mt-2 font-semibold text-neutral-600">By Priority</h3>
                      <div className="flex justify-center items-center gap-2 mt-2">
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
                <Card className="bg-white cursor-pointer hover:shadow-md transition-all hover:border-primary">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle2 className="h-8 w-8 mx-auto text-primary" />
                      <h3 className="mt-2 font-semibold text-neutral-600">By Status</h3>
                      <div className="grid grid-cols-3 gap-1 mt-2">
                        <div 
                          className="text-center cursor-pointer hover:bg-gray-50 rounded p-1"
                          onClick={() => {
                            localStorage.setItem('consult-filter', 'active');
                            navigate('/consult');
                          }}
                        >
                          <p className="text-xs">Active</p>
                          <p className="text-lg font-semibold">{consultStats.activeConsultations}</p>
                        </div>
                        <div 
                          className="text-center cursor-pointer hover:bg-gray-50 rounded p-1"
                          onClick={() => {
                            localStorage.setItem('consult-filter', 'pending');
                            navigate('/consult');
                          }}
                        >
                          <p className="text-xs">Pending</p>
                          <p className="text-lg font-semibold">{consultStats.pendingConsultations}</p>
                        </div>
                        <div 
                          className="text-center cursor-pointer hover:bg-gray-50 rounded p-1"
                          onClick={() => {
                            localStorage.setItem('consult-filter', 'completed');
                            navigate('/consult');
                          }}
                        >
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
                      <div className="mt-2">
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
              <div className="border bg-white rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold">Recent Activities</h2>
                  {recentActivities.length > 2 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAllActivities(!showAllActivities)}
                      className="h-8 px-2"
                    >
                      {showAllActivities ? (
                        <span className="flex items-center text-xs">
                          Show less <ChevronUp className="h-4 w-4 ml-1" />
                        </span>
                      ) : (
                        <span className="flex items-center text-xs">
                          Show all <ChevronDown className="h-4 w-4 ml-1" />
                        </span>
                      )}
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {recentActivities
                    .slice(0, showAllActivities ? recentActivities.length : 2)
                    .map((activity, index) => {
                      // Get icon based on activity type
                      let ActivityIcon = Clock;
                      if (activity.message.includes("consultation")) {
                        ActivityIcon = MessageSquare;
                      } else if (activity.message.includes("assessment")) {
                        ActivityIcon = ClipboardList;
                      } else if (activity.message.includes("appointment")) {
                        ActivityIcon = Calendar;
                      } else if (activity.message.includes("patient")) {
                        ActivityIcon = Users;
                      }
                      
                      return (
                        <Card 
                          key={index} 
                          className="overflow-hidden bg-white hover:shadow-md transition-shadow border-l-0 hover:border-l-4 hover:border-l-primary pl-0 hover:pl-0"
                          onClick={() => {
                            if (activity.message.includes("consultation")) {
                              navigate('/consult');
                            } else if (activity.message.includes("appointment")) {
                              navigate('/patients');
                            } else if (activity.message.includes("patient")) {
                              navigate('/patients');
                            } else {
                              // Default navigation
                              navigate('/patients');
                            }
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex gap-3">
                              <div className={`
                                ${activity.message.includes("consultation") ? "text-blue-500" : 
                                  activity.message.includes("assessment") ? "text-amber-500" : 
                                  activity.message.includes("appointment") ? "text-green-500" : 
                                  activity.message.includes("patient") ? "text-primary" : 
                                  "text-gray-500"}
                              `}>
                                <ActivityIcon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{activity.message}</p>
                                <div className="flex items-center mt-1">
                                  <Clock className="h-3 w-3 text-gray-400 mr-1" />
                                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                                </div>
                              </div>
                              <div className="self-center text-gray-300">
                                <ArrowRight className="h-4 w-4" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    
                  {!showAllActivities && recentActivities.length > 2 && (
                    <Button 
                      variant="outline" 
                      className="w-full py-1 h-auto text-xs"
                      onClick={() => setShowAllActivities(true)}
                    >
                      <span className="flex items-center">
                        Show {recentActivities.length - 2} more activities <ChevronDown className="h-3 w-3 ml-1" />
                      </span>
                    </Button>
                  )}
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