import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { API_BASE_URL } from "@/lib/utils";
import { useLocation } from "react-router-dom";

// type of the user dataset
type UserData = {
  patients: any[];
  consultations: any[];
  activities: any[];
};

const LoginForm = ({ onLogin }: { onLogin: (userData: UserData) => void }) => {
  const location = useLocation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const saveUserDataToLocal = (data: UserData, userProfile: any) => {
    localStorage.setItem('userData', JSON.stringify({...data, user: userProfile, lastSync: new Date().toISOString()}));
  };

  // Prefill phoneNumber if we were navigated here from Signup
  const state = location.state as { prefillPhone?: string } | undefined;
  useEffect(() => {
    if (location.state?.prefillPhone) {
      setPhoneNumber(location.state.prefillPhone);
    }
  }, [location.state]);

  const fetchUserData = async (userId: string) => {
    try{
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/user-data`, { headers: { Authorization: `Bearer ${token}` } });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch userdata: ", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber || !pin) {
      toast({
        title: "Error",
        description: "Please enter both phone number and PIN",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    try{
      const authResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {phone: phoneNumber, pin: pin});
      const token = authResponse.data.token;
      const userProfile = authResponse.data.user;
      // save token in local storage
      localStorage.setItem('token', token);

      // check if there is cached data for offline use?
      const cachedData = localStorage.getItem('userData');
      const lastSync = cachedData ? JSON.parse(cachedData).lastSync : null;

      if (navigator.onLine) {
        // online then fresh fetch for data from server
        const userData = await fetchUserData(authResponse.data.user.id);
        saveUserDataToLocal(userData, userProfile);
        toast({ title: 'Success', description: 'Logged in and data synced successfully',});
        onLogin({ ...userData, user: userProfile });
      } else if (cachedData) {
        // offline but there is cached data
        toast({ title: 'Offline mode', description: 'Using cached data. some features maybe limited.',});
        onLogin(JSON.parse(cachedData));
      } else {
        // offline with no cached data
        toast({ title: 'Offline Mode', description: 'No cached data available. Please connect to the internet.', variant: 'destructive',});
      }
    } catch (error){
      console.error('Login Failed: ', error);
      toast({ title: 'Error', description: 'Login Failed please check your credentials and try again.', variant: 'destructive',});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-sm">
      <div className="space-y-2">
        <label 
          htmlFor="phoneNumber" 
          className="block text-sm font-medium text-gray-700"
        >
          Phone Number
        </label>
        <Input
          id="phoneNumber"
          type="tel"
          placeholder="+254"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label 
          htmlFor="pin" 
          className="block text-sm font-medium text-gray-700"
        >
          PIN
        </label>
        <Input
          id="pin"
          type="password"
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full"
          maxLength={4}
          inputMode="numeric"
          required
        />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90"
        disabled={isLoading}
      >
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
};

export default LoginForm;
