import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import PlaylistCard from "@/components/PlaylistCard";
import TrackItem from "@/components/TrackItem";
import { Playlist, Track, Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface VaultPageProps {
  onPlayTrack: (track: Track) => void;
}

export default function VaultPage({ onPlayTrack }: VaultPageProps) {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState<Track | null>(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    playlists: Playlist[];
    tracks: Track[];
  }>({ playlists: [], tracks: [] });
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistColor, setNewPlaylistColor] = useState("#1DB954");
  const [newPlaylistIcon, setNewPlaylistIcon] = useState("ri-music-fill");
  
  const { toast } = useToast();

  // Fetch playlists
  const { data: playlists = [], isLoading: isLoadingPlaylists } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists'],
  });

  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch playlist details and tracks when a playlist is selected
  useEffect(() => {
    if (selectedPlaylist) {
      fetch(`/api/playlists/${selectedPlaylist.id}`, {
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch playlist details');
          return res.json();
        })
        .then(data => {
          setPlaylistTracks(data.tracks || []);
        })
        .catch(err => {
          console.error('Error fetching playlist details:', err);
          toast({
            title: "Error",
            description: "Failed to load playlist tracks",
            variant: "destructive"
          });
        });
    }
  }, [selectedPlaylist, toast]);

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
  };

  const handleBackToPlaylists = () => {
    setSelectedPlaylist(null);
    setPlaylistTracks([]);
    setCurrentPlayingTrack(null);
  };

  const handlePlayTrack = (track: Track) => {
    setCurrentPlayingTrack(track);
    onPlayTrack(track);
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

      // Invalidate playlists query to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      
      setShowCreatePlaylist(false);
      setNewPlaylistName("");
      
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
    { value: "ri-music-fill", label: "Music" },
    { value: "ri-mic-fill", label: "Microphone" },
    { value: "ri-album-fill", label: "Album" },
    { value: "ri-file-music-fill", label: "Music File" },
    { value: "ri-sound-module-fill", label: "Sound Module" },
    { value: "ri-vidicon-fill", label: "Video" },
  ];

  const colorOptions = [
    { value: "#1DB954", label: "Green" },
    { value: "#2D46B9", label: "Blue" },
    { value: "#F230AA", label: "Pink" },
    { value: "#FFC107", label: "Yellow" },
    { value: "#FF5722", label: "Orange" },
    { value: "#9C27B0", label: "Purple" },
  ];

  // All tracks state for search
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);

  // Fetch all tracks for search when dialog opens
  useEffect(() => {
    if (showSearchDialog && allTracks.length === 0) {
      setIsLoadingTracks(true);
      fetch('/api/tracks', {
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch tracks');
          return res.json();
        })
        .then(data => {
          setAllTracks(data);
          setIsLoadingTracks(false);
        })
        .catch(err => {
          console.error('Error fetching tracks:', err);
          setIsLoadingTracks(false);
          toast({
            title: "Error",
            description: "Failed to load tracks for search",
            variant: "destructive"
          });
        });
    }
  }, [showSearchDialog, toast]);

  // Live search function
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ playlists: [], tracks: [] });
      return;
    }
    
    const query = searchQuery.toLowerCase();
    
    // Filter playlists by name
    const filteredPlaylists = playlists.filter(playlist => 
      playlist.name.toLowerCase().includes(query)
    );
    
    // Filter tracks by name
    const filteredTracks = allTracks.filter(track => 
      track.name.toLowerCase().includes(query)
    );
    
    setSearchResults({
      playlists: filteredPlaylists,
      tracks: filteredTracks
    });
  }, [searchQuery, playlists, allTracks]);
  
  // Helper to count tracks per playlist
  const getPlaylistTrackCount = (playlistId: number) => {
    // In a real app, you would fetch this from the API or have it in the playlist object
    return Math.floor(Math.random() * 15) + 1; // Mock data for now
  };

  if (isLoadingPlaylists || isLoadingCategories) {
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
          <h1 className="text-2xl font-semibold text-white">The Vault</h1>
          <div className="flex space-x-3">
            <button 
              className="text-white p-2 rounded-full hover:bg-gray-800"
              onClick={() => setShowSearchDialog(true)}
            >
              <i className="ri-search-line text-xl"></i>
            </button>
            <button 
              className="text-white p-2 rounded-full hover:bg-gray-800"
              onClick={() => setShowCreatePlaylist(true)}
            >
              <i className="ri-add-line text-xl"></i>
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content - Playlists */}
      {!selectedPlaylist ? (
        <div className="container mx-auto px-4 py-6">
          <h2 className="text-xl font-medium mb-4">Playlists</h2>
          
          {playlists.length === 0 ? (
            <div className="bg-gray-900 rounded-md p-6 mb-4 text-center">
              <p className="text-lightgray mb-4">You don't have any playlists yet.</p>
              <Button
                onClick={() => setShowCreatePlaylist(true)}
                className="bg-primary hover:bg-primary/80"
              >
                <i className="ri-add-line mr-2"></i>
                Create Your First Playlist
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {playlists.map(playlist => (
                <PlaylistCard 
                  key={playlist.id}
                  playlist={playlist}
                  trackCount={getPlaylistTrackCount(playlist.id)}
                  onClick={() => handlePlaylistSelect(playlist)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        // Playlist Detail View
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center mb-6">
            <button 
              className="mr-4 p-2 hover:bg-gray-800 rounded-full"
              onClick={handleBackToPlaylists}
            >
              <i className="ri-arrow-left-line text-xl text-white"></i>
            </button>
            <h2 className="text-2xl font-semibold text-white">{selectedPlaylist.name}</h2>
          </div>
          
          <div 
            className="bg-gradient-to-b p-6 rounded-lg mb-6"
            style={{ backgroundImage: `linear-gradient(to bottom, ${selectedPlaylist.color}30, transparent)` }}
          >
            <div className="flex items-center">
              <div 
                className="w-24 h-24 rounded-md flex items-center justify-center mr-6 flex-shrink-0"
                style={{ backgroundColor: selectedPlaylist.color }}
              >
                <i className={`${selectedPlaylist.icon} text-4xl text-white`}></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedPlaylist.name}</h2>
                <p className="text-lightgray">{playlistTracks.length} recordings · Created by you</p>
                <div className="flex mt-4 space-x-2">
                  <button 
                    className="bg-primary text-white py-2 px-6 rounded-full font-medium hover:bg-opacity-80"
                    onClick={() => {
                      if (playlistTracks.length > 0) {
                        handlePlayTrack(playlistTracks[0]);
                      }
                    }}
                    disabled={playlistTracks.length === 0}
                  >
                    <i className="ri-play-fill mr-1"></i> Play All
                  </button>
                  <button className="bg-gray-800 text-white py-2 px-4 rounded-full font-medium hover:bg-gray-700">
                    <i className="ri-add-line mr-1"></i> Add
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            {playlistTracks.length === 0 ? (
              <div className="bg-gray-900 p-6 rounded-md text-center">
                <p className="text-lightgray">This playlist is empty. Add tracks to get started.</p>
              </div>
            ) : (
              playlistTracks.map((track, index) => (
                <TrackItem 
                  key={track.id}
                  track={track}
                  index={index}
                  isPlaying={currentPlayingTrack?.id === track.id}
                  onPlay={() => handlePlayTrack(track)}
                />
              ))
            )}
          </div>
        </div>
      )}
      
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

      {/* Search Dialog */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Search</DialogTitle>
            <DialogDescription className="text-gray-400">Search for playlists and recordings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for playlists and recordings..."
                className="w-full bg-gray-800 border-gray-700 text-white"
              />
              <Button 
                className="bg-primary hover:bg-primary/80"
              >
                Search
              </Button>
            </div>
            
            {searchQuery.trim() && (
              <div className="mt-4">
                {searchResults.playlists.length === 0 && searchResults.tracks.length === 0 ? (
                  <p className="text-lightgray text-center py-4">No results found</p>
                ) : (
                  <>
                    {searchResults.playlists.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-white font-medium mb-2">Playlists</h3>
                        <div className="space-y-2">
                          {searchResults.playlists.map(playlist => (
                            <div 
                              key={playlist.id}
                              className="bg-gray-800 p-3 rounded-md flex items-center cursor-pointer hover:bg-gray-700"
                              onClick={() => {
                                handlePlaylistSelect(playlist);
                                setShowSearchDialog(false);
                              }}
                            >
                              <div 
                                className="w-10 h-10 rounded-md flex items-center justify-center mr-3"
                                style={{ backgroundColor: playlist.color }}
                              >
                                <i className={`${playlist.icon} text-white`}></i>
                              </div>
                              <div>
                                <h4 className="text-white font-medium">{playlist.name}</h4>
                                <p className="text-xs text-lightgray">{getPlaylistTrackCount(playlist.id)} recordings</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {searchResults.tracks.length > 0 && (
                      <div>
                        <h3 className="text-white font-medium mb-2">Recordings</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {searchResults.tracks.map((track, index) => (
                            <div 
                              key={track.id}
                              className="bg-gray-800 p-3 rounded-md flex items-center cursor-pointer hover:bg-gray-700"
                              onClick={() => {
                                handlePlayTrack(track);
                                setShowSearchDialog(false);
                              }}
                            >
                              <div className="w-8 h-8 rounded-md bg-gray-700 flex items-center justify-center mr-3">
                                <i className="ri-music-fill text-primary"></i>
                              </div>
                              <div className="flex-grow">
                                <h4 className="text-white font-medium">{track.name}</h4>
                                <p className="text-xs text-lightgray">
                                  {typeof track.createdAt === 'string' 
                                    ? new Date(track.createdAt).toLocaleDateString() 
                                    : track.createdAt instanceof Date 
                                      ? track.createdAt.toLocaleDateString()
                                      : 'No date'}
                                </p>
                              </div>
                              <div className="text-xs text-lightgray">
                                {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSearchDialog(false)}
              className="border-gray-700 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
