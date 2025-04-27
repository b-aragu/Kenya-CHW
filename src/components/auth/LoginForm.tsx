
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const LoginForm = ({ onLogin }: { onLogin: () => void }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
    setTimeout(() => {
      // For MVP, we'll authenticate without a backend
      setIsLoading(false);
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      onLogin();
    }, 1000);
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
