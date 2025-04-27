
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/auth/LoginForm";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check if user is already authenticated
  useEffect(() => {
    const auth = localStorage.getItem("kenya-chw-auth");
    if (auth) {
      setIsAuthenticated(true);
      navigate("/home");
    }
  }, [navigate]);

  const handleLogin = () => {
    // Store authentication in localStorage for MVP
    localStorage.setItem("kenya-chw-auth", "true");
    setIsAuthenticated(true);
    navigate("/home");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-medium p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Kenya-CHW</h1>
          <p className="text-gray-600">Mobile Health Assistant for Community Health Workers</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-center">Login</h2>
          <LoginForm onLogin={handleLogin} />
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>For demonstration purposes, you can use any phone number and PIN.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
