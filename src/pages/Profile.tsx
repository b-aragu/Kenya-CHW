
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import AppNavigation from "@/components/AppNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: "David Mwangi",
    role: "Community Health Worker",
    facility: "Kilifi County Hospital",
    region: "Kilifi County",
    phoneNumber: "+254712345678",
    lastSync: "2 hours ago",
    appVersion: "1.0.0",
  });

  useEffect(() => {
    // Check if user is authenticated
    const auth = localStorage.getItem("kenya-chw-auth");
    if (!auth) {
      navigate("/");
      return;
    }

    // Simulate loading user data
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, [navigate]);

  const handleFeatureClick = () => {
    toast({
      title: "Coming soon!",
      description: "This feature will be available in the next release.",
    });
  };

  const handleLogout = () => {
    // Remove auth from localStorage
    localStorage.removeItem("kenya-chw-auth");
    
    toast({
      title: "Logged out successfully"
    });
    
    // Navigate to login page
    navigate("/");
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light pb-16">
      <MobileLayout title="Profile">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse-light">Loading profile...</div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">User Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mr-4">
                    {userData.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{userData.name}</h3>
                    <p className="text-sm text-gray-600">{userData.role}</p>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Facility</span>
                    <span>{userData.facility}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Region</span>
                    <span>{userData.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span>{userData.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Sync</span>
                    <span>{userData.lastSync}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">App Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start font-normal text-left"
                  onClick={handleFeatureClick}
                >
                  Language Settings
                </Button>
                <Separator />
                <Button 
                  variant="ghost" 
                  className="w-full justify-start font-normal text-left"
                  onClick={handleFeatureClick}
                >
                  Sync Data
                </Button>
                <Separator />
                <Button 
                  variant="ghost" 
                  className="w-full justify-start font-normal text-left"
                  onClick={handleFeatureClick}
                >
                  Notification Settings
                </Button>
                <Separator />
                <div className="px-4 py-2 flex justify-between items-center">
                  <span className="text-sm text-gray-500">App Version</span>
                  <span className="text-sm">{userData.appVersion}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <Button 
                  variant="outline" 
                  className="w-full text-destructive border-destructive hover:bg-destructive/5"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </MobileLayout>
      <AppNavigation />
    </div>
  );
};

export default Profile;
