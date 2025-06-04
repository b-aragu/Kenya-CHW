import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { getDashboardStats } from "@/services/mockData";
import { ArrowUp, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";

export interface StatsSummaryHandle{ refresh: () => void; }

const StatsSummary = forwardRef<StatsSummaryHandle>((_, ref) => {
  const { state } = useAppContext();
  const [stats, setStats] = useState({
    totalPatients: 0,
    newPatientsThisWeek: 0
  });
  const [loaded, setLoaded] = useState(false);

   // 1) Define a function that reads from context and recomputes stats
  const computeStats = () => {
    const patients = state.userData?.patients || [];
    const consultations = state.userData?.consultations || [];
    const {
      totalPatients,
      newPatientsThisWeek,
      // (you could also grab followUps and urgentCases if you wanted)
    } = getDashboardStats(patients, consultations);

    setStats({ totalPatients, newPatientsThisWeek });
    setLoaded(true);
  };
  // 2) Expose a `.refresh()` to the parent via ref
  useImperativeHandle(ref, () => ({
    refresh() {
      computeStats();
    },
  }));

  // 3) On mount, compute stats once, and add listener for dashboard-refresh
  useEffect(() => {
    computeStats();

    const onRefreshEvent = () => {
      computeStats();
    };
    window.addEventListener("dashboard-refresh", onRefreshEvent);

    return () => {
      window.removeEventListener("dashboard-refresh", onRefreshEvent);
    };
  }, [state.userData]); 
  
   // 4) Derive growthRate and arrow direction
  const { totalPatients, newPatientsThisWeek } = stats;
  const growthRate =
    totalPatients > 0
      ? Math.round((newPatientsThisWeek / totalPatients) * 100)
      : 0;
  const isPositiveGrowth = growthRate > 0;
  const isFlatGrowth = growthRate === 0;

  return (
    <motion.div 
      className="flex items-center justify-between p-3 bg-white/90 rounded-lg shadow-sm"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <p className="text-xs text-gray-500">Total Patients</p>
        <motion.p 
          className="text-lg font-semibold"
          key={stats.totalPatients}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {totalPatients}
        </motion.p>
      </div>
      
      <div className="border-l pl-3">
        <p className="text-xs text-gray-500">New This Week</p>
        <motion.p 
          className="text-lg font-semibold"
          key={stats.newPatientsThisWeek}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {newPatientsThisWeek}
        </motion.p>
      </div>
      
      <div className="border-l pl-3">
        <p className="text-xs text-gray-500">Growth Rate</p>
        <div className="flex items-center">
          <motion.p 
            className={`text-lg font-semibold ${isPositiveGrowth ? 'text-green-600' : isFlatGrowth ? 'text-gray-600' : 'text-red-600'}`}
            key={growthRate}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {growthRate}%
          </motion.p>
          {isPositiveGrowth && <ArrowUp className="h-4 w-4 text-green-600 ml-1" />}
          {!isPositiveGrowth && !isFlatGrowth && <ArrowDown className="h-4 w-4 text-red-600 ml-1" />}
        </div>
      </div>
    </motion.div>
  );
});

StatsSummary.displayName = 'Statsummary';
export default StatsSummary; 