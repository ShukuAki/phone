import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  
  const { toast } = useToast();

  // Fetch user profile
  const { data: user, isLoading } = useQuery<Omit<User, "password">>({
    queryKey: ['/api/users/me'],
  });

  // Initialize form data when user data is loaded
  useState(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        username: user.username,
        email: user.email || "",
        phone: user.phone || "",
        password: "",
      });
    }
  });

  const handleOpenEditModal = () => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        username: user.username,
        email: user.email || "",
        phone: user.phone || "",
        password: "",
      });
    }
    setShowEditModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Only include password if it was changed
      const dataToUpdate = { ...formData };
      if (!dataToUpdate.password) {
        delete dataToUpdate.password;
      }
      
      const response = await apiRequest('PATCH', '/api/users/me', dataToUpdate);
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      // Refetch user data
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      
      setShowEditModal(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load user profile</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/users/me'] })}
            className="bg-primary hover:bg-primary/80"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Generate initials for avatar
  const getInitials = () => {
    if (user.fullName) {
      return user.fullName
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-darkgray sticky top-0 z-10 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-white">Profile</h1>
          <Button
            onClick={handleOpenEditModal}
            className="text-white bg-gray-800 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-700"
          >
            Edit
          </Button>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center mb-8">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center mb-4 relative"
            style={{ backgroundColor: user.avatarColor || "#1DB954" }}
          >
            <span className="text-white text-2xl font-bold">{getInitials()}</span>
            <button className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full flex items-center justify-center border-2 border-secondary">
              <i className="ri-camera-fill text-white"></i>
            </button>
          </div>
          <h2 className="text-xl font-bold text-white">{user.fullName || user.username}</h2>
          <p className="text-lightgray">{user.email || "No email set"}</p>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-5 mb-6">
          <h3 className="text-lg font-medium mb-4">Account Information</h3>
          
          <div className="mb-4">
            <label className="block text-sm text-lightgray mb-1">Username</label>
            <div className="text-white py-1">{user.username}</div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm text-lightgray mb-1">Email</label>
            <div className="text-white py-1">{user.email || "Not set"}</div>
          </div>
          
          <div>
            <label className="block text-sm text-lightgray mb-1">Phone</label>
            <div className="text-white py-1">{user.phone || "Not set"}</div>
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-5 mb-6">
          <h3 className="text-lg font-medium mb-4">Storage</h3>
          
          <div className="mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-lightgray">Used Storage</span>
              <span className="text-sm text-white">0.4 GB / 1 GB</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: "40%" }}></div>
            </div>
          </div>
          
          <button className="text-primary text-sm font-medium">
            Upgrade Storage
          </button>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-5 mb-6">
          <h3 className="text-lg font-medium mb-4">Statistics</h3>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-800 rounded-md p-3">
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-xs text-lightgray">Recordings</div>
            </div>
            <div className="bg-gray-800 rounded-md p-3">
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-xs text-lightgray">Playlists</div>
            </div>
            <div className="bg-gray-800 rounded-md p-3">
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-xs text-lightgray">Categories</div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center mt-8">
          <button className="text-lightgray hover:text-white font-medium">
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Edit Profile Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="mb-4">
                <label htmlFor="fullName" className="block text-sm font-medium text-lightgray mb-1">
                  Full Name
                </label>
                <Input
                  type="text"
                  id="fullName"
                  name="fullName"
                  className="w-full bg-gray-800 border-gray-700 text-white"
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-lightgray mb-1">
                  Username
                </label>
                <Input
                  type="text"
                  id="username"
                  name="username"
                  className="w-full bg-gray-800 border-gray-700 text-white"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-lightgray mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full bg-gray-800 border-gray-700 text-white"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-lightgray mb-1">
                  Phone
                </label>
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="w-full bg-gray-800 border-gray-700 text-white"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-lightgray mb-1">
                  New Password (leave blank to keep current)
                </label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  className="w-full bg-gray-800 border-gray-700 text-white"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="border-gray-700 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/80"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
