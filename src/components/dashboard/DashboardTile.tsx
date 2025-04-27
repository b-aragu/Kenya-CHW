
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardTileProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: string;
}

const DashboardTile = ({ title, value, icon, color = "bg-primary" }: DashboardTileProps) => {
  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className={`flex-shrink-0 w-10 h-10 ${color} rounded-md flex items-center justify-center text-white`}>
            {icon}
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardTile;
