import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Patients from "./pages/Patients";
import AddPatient from "./pages/AddPatient";
import PatientDetail from "./pages/PatientDetail";
import PatientHistory from "./pages/PatientHistory";
import Consult from "./pages/Consult";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { SyncProvider } from "./context/SyncContext";
import { useState } from "react";
import { useAppContext } from "./context/AppContext";
import SignupForm from "./components/auth/SignupForm";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const { state, setState } = useAppContext();

  const handleAuthSucess = (userData: any) => {
    setState((prev) => ({...prev, userData: userData, }));
    setIsAuthenticated(true);
  };
  return(
  <QueryClientProvider client={queryClient}>
    <SyncProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path='/signup' element={<SignupForm />}/>
            <Route path="/home" element={<Home />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/add" element={<AddPatient />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/patients/:id/history" element={<PatientHistory />} />
            <Route path="/consult" element={<Consult />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SyncProvider>
  </QueryClientProvider>
)};

export default App;
