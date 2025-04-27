
import { useNavigate, useLocation } from "react-router-dom";

const AppNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { name: "Home", path: "/home", icon: "home" },
    { name: "Patients", path: "/patients", icon: "users" },
    { name: "Consult", path: "/consult", icon: "message-square" },
    { name: "Profile", path: "/profile", icon: "user" }
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center p-2 z-10">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-md ${
              isActive ? "text-primary" : "text-gray-500"
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              {renderIcon(item.icon, isActive)}
            </div>
            <span className="text-xs mt-1">{item.name}</span>
          </button>
        );
      })}
    </nav>
  );
};

// Function to render different icons
const renderIcon = (iconName: string, isActive: boolean) => {
  const activeColor = "currentColor";
  const inactiveColor = "currentColor";
  const color = isActive ? activeColor : inactiveColor;
  
  switch (iconName) {
    case "home":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      );
    case "users":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      );
    case "message-square":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      );
    case "user":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      );
    default:
      return null;
  }
};

export default AppNavigation;
