import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/auth/LoginForm";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userProfile = localStorage.getItem("userProfile");
    
    if (token && userProfile) {
      // Verify token expiration
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = decodedToken.exp * 1000;
        
        if (Date.now() < expirationTime) {
          setIsAuthenticated(true);
          navigate("/home");
        } else {
          // Token expired
          localStorage.removeItem("token");
          localStorage.removeItem("userProfile");
          toast({
            title: "Session Expired",
            description: "Please log in again",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Token verification failed:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("userProfile");
      }
    }
    
    setIsLoading(false);
  }, [navigate, toast]);

  const handleLogin = (userData: any) => {
    // Store user profile in localStorage
    localStorage.setItem("userProfile", JSON.stringify(userData.user));
    
    setIsAuthenticated(true);
    navigate("/home");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-medium p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto bg-white rounded-full p-3 w-24 h-24 flex items-center justify-center shadow-lg mb-4">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Kenya-CHW</h1>
          <p className="text-gray-600">
            Mobile Health Assistant for Community Health Workers
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-6 text-center">Login</h2>
          <LoginForm onLogin={handleLogin} />
        </div>
        
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-sm">Offline Capable</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
          <p className="mt-4 text-gray-500 text-sm">
            Works without internet connection. Data syncs automatically when online.
          </p>
        </div>
      </div>
      
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Kenya-CHW. All rights reserved.</p>
        <p className="mt-1">v1.0.0</p>
      </footer>
    </div>
  );
};

export default Index;