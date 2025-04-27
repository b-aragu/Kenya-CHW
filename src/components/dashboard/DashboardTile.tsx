import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface DashboardTileProps {
  title: string;
  value: number;
  icon: ReactNode;
  color: string;
  onClick?: () => void;
}

const DashboardTile = ({ title, value, icon, color, onClick }: DashboardTileProps) => {
  const [prevValue, setPrevValue] = useState(value);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const [isDecreasing, setIsDecreasing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle value changes with animation
  useEffect(() => {
    if (value !== prevValue) {
      setIsIncreasing(value > prevValue);
      setIsDecreasing(value < prevValue);
      setIsAnimating(true);
      
      // Reset animation state after animation completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setIsIncreasing(false);
        setIsDecreasing(false);
        setPrevValue(value);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  return (
    <motion.div 
      className={`p-4 rounded-lg ${color} text-white cursor-pointer hover:shadow-md transition-all`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-start">
        <div className="text-lg">{icon}</div>
        {isAnimating && (
          <div>
            {isIncreasing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-green-200 text-xs"
              >
                ↑
              </motion.div>
            )}
            {isDecreasing && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-200 text-xs"
              >
                ↓
              </motion.div>
            )}
          </div>
        )}
      </div>
      <div className="mt-2">
        <p className="text-sm font-medium opacity-80">{title}</p>
        <motion.h3 
          className="text-2xl font-bold"
          key={value}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {value}
        </motion.h3>
      </div>
    </motion.div>
  );
};

export default DashboardTile;
