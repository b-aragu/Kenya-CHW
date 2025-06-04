import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Users, UserPlus, UserCheck, AlertTriangle } from "lucide-react";
import DashboardTile from "./DashboardTile";
import { getDashboardStats, DashboardStats as StatsType } from "@/services/mockData";
import { useAppContext } from "@/context/AppContext";

interface DashboardStatsProps {
  onRefresh?: () => void;
}

// Define the ref interface
export interface DashboardStatsRef {
  refresh: () => void;
}

const DashboardStats = forwardRef<DashboardStatsRef, DashboardStatsProps>(
  (props, ref) => {
    const { state } = useAppContext();
    const [stats, setStats] = useState<StatsType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

     // 1) Fetch stats by pulling arrays out of context and passing them to getDashboardStats(...)
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const patients = state.userData?.patients || [];
        const consultations = state.userData?.consultations || [];
        const data = getDashboardStats(patients, consultations);
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Expose the refresh method via ref
    useImperativeHandle(ref, () => ({
      refresh: fetchStats
    }));

    // 2) On mount, load once
    useEffect(() => {
      fetchStats();
    }, [state.userData]);

    // 3) Listen for the 'dashboard-refresh' event, if parent wants to trigger it
    useEffect(() => {
      if (props.onRefresh) {
        const refreshListener = () => {
          fetchStats();
        };
        
        // Create a custom event listener for refresh
        window.addEventListener('dashboard-refresh', refreshListener);
        
        return () => {
          window.removeEventListener('dashboard-refresh', refreshListener);
        };
      }
    }, [props.onRefresh, state.userData]);

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
  }
);

DashboardStats.displayName = "DashboardStats";
export default DashboardStats;
