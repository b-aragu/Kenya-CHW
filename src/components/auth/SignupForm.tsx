// src/components/auth/SignupForm.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { API_BASE_URL } from "@/lib/utils";

const SignupForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state:
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [facility, setFacility] = useState("");
  const [region, setRegion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic client‐side validation
    if (!name || !email || !phoneNumber || !pin || !facility || !region) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1) Call your “register” endpoint
      await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name,
        email,
        role: "chw",
        phone: phoneNumber,
        password: pin,
        facility,
        region,
      });

      // 2) Registration succeeded. Show a toast and redirect to Login.
      toast({
        title: "Registration Successful",
        description:
          "Your account was created. Please log in with your phone & PIN.",
      });

      // Optionally, if you want to prefill the login phone field:
      navigate("/", { state: { prefillPhone: phoneNumber } });
    } catch (err: any) {
      console.error("Registration Failed:", err);
      const msg =
        err.response?.data?.message ||
        "Registration failed. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 w-full max-w-md mx-auto mt-8"
    >
      <h2 className="text-2xl font-semibold text-center">Sign Up</h2>

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Full Name
        </label>
        <Input
          id="name"
          type="text"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="jane.doe@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700"
        >
          Phone Number
        </label>
        <Input
          id="phone"
          type="tel"
          placeholder="+2547XXXXXXXX"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
          className="w-full"
        />
      </div>

      <div>
        <label
          htmlFor="pin"
          className="block text-sm font-medium text-gray-700"
        >
          PIN (4 digits)
        </label>
        <Input
          id="pin"
          type="password"
          placeholder="1234"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={4}
          inputMode="numeric"
          required
          className="w-full"
        />
      </div>

      <div>
        <label
          htmlFor="facility"
          className="block text-sm font-medium text-gray-700"
        >
          Facility
        </label>
        <Input
          id="facility"
          type="text"
          placeholder="e.g. Kisumu Health Center"
          value={facility}
          onChange={(e) => setFacility(e.target.value)}
          required
          className="w-full"
        />
      </div>

      <div>
        <label
          htmlFor="region"
          className="block text-sm font-medium text-gray-700"
        >
          Region
        </label>
        <Input
          id="region"
          type="text"
          placeholder="e.g. Western Kenya"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          required
          className="w-full"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90"
        disabled={isLoading}
      >
        {isLoading ? "Registering..." : "Sign Up"}
      </Button>
    </form>
  );
};

export default SignupForm;
