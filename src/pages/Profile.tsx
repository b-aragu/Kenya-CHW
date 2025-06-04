import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import AppNavigation from "@/components/AppNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import axios from 'axios';
import { useAppContext } from "@/context/AppContext";

// Helper function for loading sync storage?
const safeParseJSON = (str: string | null): any => {
  if (str === null || str === 'undefined') return {};
  try { return JSON.parse(str); }
  catch (err) {
    console.error('JSON parsing error: ', err);
    return {};
  }
};

// format last sync time
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 3153600;
  if (interval > 1) return Math.floor(interval) + ' years ago';

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';

  return Math.floor(interval) + ' seconds ago';
};

const Profile = () => {
  const navigate = useNavigate();
  const { state, syncOfflineChanges } = useAppContext();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: "",
    role: "",
    facility: "",
    region: "",
    phoneNumber: "",
    lastSync: "",
    appVersion: "1.0.0",
  });

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    // get user data from local storage
    const userProfile = safeParseJSON(localStorage.getItem('userProfile'));
    const storedUserData = safeParseJSON(localStorage.getItem('userData'));

    setUserData({
      name: userProfile.name || 'CHW',
      role: userProfile.role === 'chw' ? 'Community Health Worker' : userProfile.role,
      facility: userProfile.facility || 'Unkown facility',
      region: userProfile.region || 'Unkown region',
      phoneNumber: userProfile.phone || 'Unkown',
      lastSync: storedUserData.lastSync ? formatTimeAgo(storedUserData.lastSync) : 'Never',
      appVersion: '1.0.0',
    });

    setIsLoading(false);
  }, [navigate, state.userData]);

  const handleSyncData = async () => {
    try {
      const result = await syncOfflineChanges();
      if (result.success){
        // update last sync time
        const storedUserData = safeParseJSON(localStorage.getItem('userData'));
        const newLastSync = new Date().toISOString();

        localStorage.setItem('userData', JSON.stringify({ ...storedUserData, lastSync: newLastSync }));

        setUserData(prev => ({...prev, lastSync: formatTimeAgo(newLastSync)}));

        toast({ title: 'Sync successful', description: 'All ofline data has been synchronized' });
      } else{ toast({ title: 'Sync Failed', description: result.error || 'Could not sync data. Please try again.', variant: 'destructive' }); }
    } catch (error) { toast({ title: 'Sync Error', description: 'An unexpected error occured during sunc', variant: 'destructive' }); }
  };

  const handleFeatureClick = () => {
    toast({
      title: "Coming soon!",
      description: "This feature will be available in the next release.",
    });
  };

  const handleLogout = () => {
    // Remove auth from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userData');
    localStorage.removeItem('syncQueue');
    localStorage.removeItem('create-consultation')
    
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
                  onClick={handleSyncData}
                >
                  Sync Data Now
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
