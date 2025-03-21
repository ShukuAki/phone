import { Switch, Route } from "wouter";
import Footer from "./components/Footer";
import VaultPage from "./pages/Vault";
import UploadPage from "./pages/Upload";
import ProfilePage from "./pages/Profile";
import AudioPlayer from "./components/AudioPlayer";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { Track } from "@shared/schema";

function App() {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-secondary text-white pb-20">
      <Switch>
        <Route path="/" component={() => <VaultPage onPlayTrack={(track) => {
          setCurrentTrack(track);
          setIsPlaying(true);
        }} />} />
        <Route path="/upload" component={UploadPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route component={NotFound} />
      </Switch>

      <Footer />
      
      {currentTrack && (
        <AudioPlayer 
          track={currentTrack} 
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onClose={() => setCurrentTrack(null)}
        />
      )}
      
      <Toaster />
    </div>
  );
}

export default App;
