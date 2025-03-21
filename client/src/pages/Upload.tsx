import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Playlist } from "@shared/schema";
import { Button } from "@/components/ui/button";
import Recorder from "@/components/Recorder";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UploadPageProps {
  darkMode?: boolean;
}

export default function UploadPage({ darkMode = false }: UploadPageProps) {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistIcon, setNewPlaylistIcon] = useState("ri-music-fill");
  const [newPlaylistColor, setNewPlaylistColor] = useState("#1DB954");
  
  const { toast } = useToast();

  // Fetch playlists
  const { data: playlists = [], isLoading: isLoadingPlaylists, refetch: refetchPlaylists } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists'],
  });

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setShowUploadOptions(true);
  };

  const handleBackToPlaylists = () => {
    setSelectedPlaylist(null);
    setShowUploadOptions(false);
  };

  const handleShowRecorder = () => {
    setShowRecorder(true);
    setShowUploadOptions(false);
  };

  const handleRecorderBack = () => {
    setShowRecorder(false);
    setShowUploadOptions(true);
  };

  const handleRecorderComplete = () => {
    setShowRecorder(false);
    setShowUploadOptions(false);
    setSelectedPlaylist(null);
    toast({
      title: "Success",
      description: "Your recording has been saved successfully",
    });
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a playlist name",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/playlists', {
        name: newPlaylistName,
        color: newPlaylistColor,
        icon: newPlaylistIcon
      });

      if (!response.ok) {
        throw new Error('Failed to create playlist');
      }

      // Clear out the form
      setShowCreatePlaylist(false);
      setNewPlaylistName("");
      
      // First invalidate the queries
      await queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      
      // Then explicitly refetch to ensure UI updates
      await refetchPlaylists();
      
      toast({
        title: "Success",
        description: "Playlist created successfully",
      });
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive"
      });
    }
  };

  const iconOptions = [
    { value: "ri-mic-fill", label: "Microphone" },
    { value: "ri-file-music-fill", label: "Music File" },
    { value: "ri-sound-module-fill", label: "Sound Module" },
    { value: "ri-vidicon-fill", label: "Video" },
    { value: "ri-folder-music-fill", label: "Music Folder" },
    { value: "ri-music-fill", label: "Music" },
  ];

  const colorOptions = [
    { value: "#1DB954", label: "Green" },
    { value: "#2D46B9", label: "Blue" },
    { value: "#F230AA", label: "Pink" },
    { value: "#FFC107", label: "Yellow" },
    { value: "#FF5722", label: "Orange" },
    { value: "#9C27B0", label: "Purple" },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedPlaylist) return;
    
    // Check if it's an audio file
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Error",
        description: "Please select an audio file",
        variant: "destructive"
      });
      return;
    }
    
    // Create a form with the file and metadata
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('name', file.name.replace(/\.[^/.]+$/, '')); // Remove extension
    formData.append('duration', '0'); // We'll update this after the upload
    
    // Upload the file
    fetch('/api/tracks/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })
      .then(response => {
        if (!response.ok) throw new Error('Upload failed');
        return response.json();
      })
      .then((track) => {
        // Add the track to the playlist
        fetch(`/api/playlists/${selectedPlaylist.id}/tracks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trackId: track.id,
            position: 9999 // Add to the end
          }),
          credentials: 'include'
        })
        .then(response => {
          if (!response.ok) throw new Error('Failed to add track to playlist');
          
          toast({
            title: "Success",
            description: "Your audio file has been uploaded and added to the playlist",
          });
          setShowUploadOptions(false);
          setSelectedPlaylist(null);
        })
        .catch(error => {
          console.error('Error adding to playlist:', error);
          toast({
            title: "Warning",
            description: "File uploaded but couldn't add to playlist",
            variant: "destructive"
          });
        });
      })
      .catch(error => {
        console.error('Upload error:', error);
        toast({
          title: "Error",
          description: "Failed to upload audio file",
          variant: "destructive"
        });
      });
  };

  if (isLoadingPlaylists) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-darkgray sticky top-0 z-10 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-white">Upload</h1>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-6">
        {/* Playlist Selection */}
        {!showUploadOptions && !showRecorder && (
          <>
            <h2 className="text-xl font-medium mb-6">Select a Playlist</h2>
            
            <div className="space-y-3 mb-8">
              {playlists.map(playlist => (
                <div 
                  key={playlist.id}
                  className="bg-gray-900 rounded-md p-4 hover:bg-gray-800 transition duration-200 cursor-pointer"
                  onClick={() => handlePlaylistSelect(playlist)}
                >
                  <div className="flex items-center">
                    <div className="mr-3" style={{ color: playlist.color }}>
                      <i className={`${playlist.icon} text-xl`}></i>
                    </div>
                    <h3 className="font-medium text-white">{playlist.name}</h3>
                  </div>
                </div>
              ))}
              
              <div 
                className="bg-gray-900 rounded-md p-4 hover:bg-gray-800 transition duration-200 cursor-pointer"
                onClick={() => setShowCreatePlaylist(true)}
              >
                <div className="flex items-center">
                  <div className="text-purple-500 mr-3">
                    <i className="ri-add-line text-xl"></i>
                  </div>
                  <h3 className="font-medium text-white">Create New Playlist</h3>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Upload Options */}
        {showUploadOptions && selectedPlaylist && (
          <div>
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <Button 
                  variant="ghost" 
                  className="mr-4 p-2 hover:bg-gray-800 rounded-full" 
                  onClick={handleBackToPlaylists}
                >
                  <i className="ri-arrow-left-line text-xl text-white"></i>
                </Button>
                <h2 className="text-xl font-medium">{selectedPlaylist.name}</h2>
              </div>
              <p className="text-lightgray text-sm">Select how you want to add your audio</p>
            </div>
            
            <div className="flex flex-col space-y-4">
              <label className="bg-gray-900 hover:bg-gray-800 p-6 rounded-lg flex items-center justify-center transition duration-200 cursor-pointer">
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="text-center">
                  <div 
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: selectedPlaylist.color }}
                  >
                    <i className="ri-upload-cloud-fill text-white text-3xl"></i>
                  </div>
                  <h3 className="font-medium text-white text-lg">Upload Audio File</h3>
                  <p className="text-lightgray text-sm mt-2">MP3, WAV, M4A files supported</p>
                </div>
              </label>
              
              <button 
                className="bg-gray-900 hover:bg-gray-800 p-6 rounded-lg flex items-center justify-center transition duration-200 cursor-pointer"
                onClick={handleShowRecorder}
              >
                <div className="text-center">
                  <div className="bg-primary w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                    <i className="ri-mic-fill text-white text-3xl"></i>
                  </div>
                  <h3 className="font-medium text-white text-lg">Record New Audio</h3>
                  <p className="text-lightgray text-sm mt-2">Record directly from your device</p>
                </div>
              </button>
            </div>
          </div>
        )}
        
        {/* Recorder Interface */}
        {showRecorder && selectedPlaylist && (
          <Recorder 
            categoryId={0} // Not using categories anymore
            categoryName={selectedPlaylist.name}
            onSaveComplete={handleRecorderComplete}
            onCancel={handleRecorderBack}
            playlists={playlists}
          />
        )}
      </div>
      
      {/* Create Playlist Dialog */}
      <Dialog open={showCreatePlaylist} onOpenChange={setShowCreatePlaylist}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Playlist</DialogTitle>
            <DialogDescription className="text-gray-400">Create a new playlist to organize your recordings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-lightgray mb-1">Playlist Name</label>
              <Input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Enter playlist name"
                className="w-full bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-lightgray mb-1">Icon</label>
              <Select
                value={newPlaylistIcon}
                onValueChange={setNewPlaylistIcon}
              >
                <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map(icon => (
                    <SelectItem key={icon.value} value={icon.value}>
                      <div className="flex items-center">
                        <i className={`${icon.value} mr-2`}></i>
                        <span>{icon.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-lightgray mb-1">Color</label>
              <Select
                value={newPlaylistColor}
                onValueChange={setNewPlaylistColor}
              >
                <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: color.value }}
                        ></div>
                        <span>{color.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreatePlaylist(false)}
              className="border-gray-700 text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePlaylist}
              className="bg-primary hover:bg-primary/80"
            >
              Create Playlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}