import { useEffect, useState } from "react";
import { getDashboardStats } from "@/services/mockData";
import { ArrowUp, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";

const StatsSummary = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    newPatientsThisWeek: 0
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchData = () => {
      const data = getDashboardStats();
      setStats({
        totalPatients: data.totalPatients,
        newPatientsThisWeek: data.newPatientsThisWeek
      });
      setLoaded(true);
    };

    fetchData();

    // Listen for dashboard refresh events
    const refreshHandler = () => fetchData();
    window.addEventListener('dashboard-refresh', refreshHandler);

    return () => {
      window.removeEventListener('dashboard-refresh', refreshHandler);
    };
  }, []);

  const growthRate = stats.totalPatients > 0 
    ? Math.round((stats.newPatientsThisWeek / stats.totalPatients) * 100) 
    : 0;
  
  // Simple growth trend indicator
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
          {stats.totalPatients}
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
          {stats.newPatientsThisWeek}
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
};

export default StatsSummary; 