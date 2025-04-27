
import { useEffect, useState } from "react";
import { Users, UserPlus, UserCheck, AlertTriangle } from "lucide-react";
import DashboardTile from "./DashboardTile";
import { getDashboardStats, DashboardStats } from "@/services/mockData";

const DashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be an API call
        const data = getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="grid grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg"></div>
      ))}
    </div>;
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      <DashboardTile
        title="Total Patients"
        value={stats.totalPatients}
        icon={<Users />}
        color="bg-primary"
      />
      <DashboardTile
        title="New This Week"
        value={stats.newPatientsThisWeek}
        icon={<UserPlus />}
        color="bg-secondary"
      />
      <DashboardTile
        title="Follow-ups"
        value={stats.followUps}
        icon={<UserCheck />}
        color="bg-primary"
      />
      <DashboardTile
        title="Urgent Cases"
        value={stats.urgentCases}
        icon={<AlertTriangle />}
        color="bg-destructive"
      />
    </div>
  );
};

export default DashboardStats;
