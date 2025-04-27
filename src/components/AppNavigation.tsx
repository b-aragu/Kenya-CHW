
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, MessageSquare, User } from "lucide-react";

const AppNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { name: "Home", path: "/home", icon: Home },
    { name: "Patients", path: "/patients", icon: Users },
    { name: "Consult", path: "/consult", icon: MessageSquare },
    { name: "Profile", path: "/profile", icon: User }
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center p-2 z-10">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-md transition-colors ${
              isActive ? "text-primary" : "text-gray-500"
            }`}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">{item.name}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default AppNavigation;
